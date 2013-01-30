(function(window, undefined) {

    'use strict';



    var $ = function(s) { return document.querySelector(s); };

    // default file; fetch from get parameter pdf if there...
    var url = 'test.pdf';
    (function() {
        var href = location.href;
        var rgx = /(\?|&)pdf=([^&]+)/g;
        var m = rgx.exec(href);
        if (m && m[2]) {
            url = decodeURIComponent( m[2] );
        }
    })();
    // NOTE: pdf requires same domain or CORS!


    // globals
    var p;
    var zoom = 1;
    var pageInPx = [0, 0];

    var currPageNr = 1;
    var numPages = 10000;

    var currNoteNr = 0;
    var numNotes = 0;

    var creatingNote = false;
    var newNoteIsHighlight = true;
    var notes = {};
    var notesArr = [];

    var cvsEl = $('#cvs');
    var ctx = cvsEl.getContext('2d');



    // glue GUI
    $('#currPage').addEventListener('change', function(ev) {
        toPage( parseInt(ev.target.value, 10) );
    });

    $('#zoomSel').addEventListener('change', function(ev) {
        zoom = parseFloat(ev.target.value);
        toPage();
    });

    var toPage = function(nr, isRelative) {
        if (nr === undefined) { nr = currPageNr; }
        if (isRelative) { currPageNr += nr; } else { currPageNr = nr; }

        if (currPageNr < 1) { currPageNr = 1; }
        else if (currPageNr > numPages) { currPageNr = numPages; }

        $('#currPage').value = currPageNr;

        p.getPage(currPageNr).then(renderPage);
    };

    document.body.addEventListener('keydown', function(ev) {
        switch (ev.keyCode) {
            case 39://right
            case 40://down
                toPage(1, true);
                break;

            case 37://left
            case 38://up
                toPage(1, true);
                break;
        }
        console.log(ev.keyCode);
    });



    $('#noteSel').addEventListener('change', function(ev) {
        var v = ev.target.value;
        creatingNote = !!v;
        newNoteIsHighlight = (v === 'highlight');
    });

    var p0;
    var mouseHandler = function(ev) {
        if (!creatingNote) { return; }

        /*global prompt:false */
        var tgtEl = ev.target;
        if (tgtEl !== document.body && tgtEl !== $('#cvs')) { return; }

        var p1;
        var isDown = ev.type === 'mousedown';
        var cvsPos = [
            $('#cvs').offsetLeft,
            $('#cvs').offsetTop
        ];
        var scroll = [
            document.body.scrollLeft,
            document.body.scrollTop
        ];
        var d = pageInPx;
        var pos = [
            (ev.clientX - cvsPos[0] + scroll[0]) / d[0],
            (ev.clientY - cvsPos[1] + scroll[1]) / d[1]
        ];

        if (isDown) {
            p0 = pos;
        }
        else {
            p1 = pos;

            if (newNoteIsHighlight) {
                addNote(['highlight', p0[0], p0[1], p1[0]-p0[0], p1[1]-p0[1]]);
            }
            else {
                var txt = prompt('text?', '');
                if (!txt) { return; }
                addNote(['takeNote', txt, p0[0], p0[1]]);
            }

            toPage();
        }
    };
    document.body.addEventListener('mousedown', mouseHandler);
    document.body.addEventListener('mouseup',   mouseHandler);





    var toNote = function(nr, isRelative) {
        if (nr === undefined) { nr = currNoteNr; }
        if (isRelative) { currNoteNr += nr; } else { currNoteNr = nr; }

        var min = numNotes ? 1 : 0;
        if (currNoteNr < min) { currNoteNr = min; }
        else if (currNoteNr > numNotes) { currNoteNr = numNotes; }

        $('#currNote').value = currNoteNr;

        // go there
        var nt = notesArr[ currNoteNr - 1 ];
        console.log(nt);
        var o = getPageOfNote(nt);
        if (o) {
            toPage(o[0]);
        }
        else {
            toPage();
        }
    };

    var addNote = function(note) {
        console.log(note);
        var pageNotes = notes[currPageNr];
        if (!pageNotes) {
            pageNotes = [];
            notes[currPageNr] = pageNotes;
        }
        ++currNoteNr;
        pageNotes.push(note);
        updateNotes();
    };

    var updateNotes = function() {
        notesArr = [];
        var pageNotes, i, f;
        for (i = 1, f = numPages; i <= numPages; ++i) {
            pageNotes = notes[i];
            if (!pageNotes) { continue; }
            notesArr = notesArr.concat(pageNotes);
        }

        numNotes = notesArr.length;
        $('#numNotes').innerHTML = numNotes;

        currNoteNr = (numNotes === 0) ? 0 : Math.min(1, currNoteNr);
        $('#currNote').value = currNoteNr;
    };

    var deleteNote = function() {
        var nt = notesArr[currNoteNr - 1];
        var o = getPageOfNote(nt);
        notes[ o[0] ].splice( o[1], 1 );
        --numNotes;
        --currNoteNr;
        updateNotes();
        toNote();
    };

    var getPageOfNote = function(targetNote) {
        var pageNotes, k, i, f, note;
        for (k in notes) {
            pageNotes = notes[k];
            for (i = 0, f = pageNotes.length; i < f; ++i) {
                note = pageNotes[i];
                if (note === targetNote) { return [parseInt(k, 10), i]; }
            }
        }
    };

    var importNotes = function() {
        /*global alert:false */
        try {
            var v = window.localStorage.getItem(url);
            if (!v) { v = '{}'; }
            var o = prompt('JSON:', v);
            notes = JSON.parse(o);
            updateNotes();
            toNote(numNotes);
        } catch (ex) {
            alert('error parsing JSON!');
        }
    };

    var exportNotes = function() {
        var v = JSON.stringify(notes);
        window.localStorage.setItem(url, v);
        prompt('JSON:', v);
    };

    var renderNotes = function() {
        var pageNotes = notes[currPageNr];
        if (!pageNotes) { return; }
        var fnName, args;
        for (var i = 0, f = pageNotes.length; i < f; ++i) {
            args = pageNotes[i].slice();
            fnName = args.shift();
            //console.log(fnName, args);
            window[fnName].apply(window, args);
        }
    };



    // supported annotations

    // http://www.nihilogic.dk/labs/canvas_sheet/HTML5_Canvas_Cheat_Sheet.png

    var highlight = function(x, y, w, h, clr) {
        if (clr === undefined) { clr = 'rgba(255, 255, 0, 0.5)'; }
        // yellow: 'rgba(255, 255, 0, 0.5)'
        // magenta: 'rgba(255, 0, 255, 0.5)'

        var d = pageInPx;
        x *= d[0];
        w *= d[0];
        y *= d[1];
        h *= d[1];
        ctx.fillStyle = clr;
        ctx.fillRect(x, y, w, h);
    };

    var takeNote = function(text, x, y, fh, clr, bgClr) {
        if (fh === undefined) { fh = 0.03; }
        if (clr === undefined) { clr = 'red'; }
        if (bgClr === undefined) { bgClr = 'yellow'; }

        var d = pageInPx;
        x *= d[0];
        y *= d[1];
        fh *= Math.min(d[0],d[1]);

        ctx.font = fh + 'px sans-serif';
        var w =  ctx.measureText(text, x, y).width;
        var g = fh * 0.25;
        ctx.fillStyle = bgClr;
        //ctx.fillRect(x-g, y-g, w+2*g, fh+2*g);
        ctx.fillRect(x, y, w+2*g, fh+2*g);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = clr;
        //ctx.fillText(text, x, y);
        ctx.fillText(text, x+g, y+g);
    };



    // internals
    var renderPage = function(page) {
        // prepare canvas using PDF page dimensions
        var viewport = page.getViewport(zoom);
        pageInPx = [ viewport.width, viewport.height ];
        cvsEl.width = pageInPx[0];
        cvsEl.height = pageInPx[1];

        // render PDF page into canvas context
        page.render({canvasContext: ctx, viewport: viewport}).then(renderNotes);
    };

    // disable workers to avoid yet another cross-origin issue (workers need the URL of
    // the script to be loaded, and dynamically loading a cross-origin script does not work)
    PDFJS.disableWorker = true;

    var openPDF = function(url) {
        if (!url) { return; }

        // asynchronous download PDF as an ArrayBuffer
        PDFJS.getDocument(url).then(function(pdf) {
            p = pdf;

            currPageNr = 1;
            numPages = p.numPages;
            $('#currPage').value = currPageNr;
            $('#currPage').setAttribute('max', numPages);
            $('#numPages').innerHTML = numPages;

            toPage();
        });
    };

    openPDF(url);



    // export API
    window.openPDF     = openPDF;
    window.toPage      = toPage;

    window.toNote      = toNote;
    window.highlight   = highlight;
    window.takeNote    = takeNote;
    window.deleteNote  = deleteNote;
    window.importNotes = importNotes;
    window.exportNotes = exportNotes;

})(window);
