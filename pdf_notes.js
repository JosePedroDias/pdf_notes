var $ = function(s) { return document.querySelector(s); };

// default file; fetch from get parameter pdf if there...
var url = 'VASTv3.0.pdf';
(function() {
	var href = location.href;
	var rgx = /(\?|&)pdf=([^&]+)/g;
	var m = rgx.exec(href);
	if (m && m[2]) {
		url = decodeURIComponent( m[2] );
	}
	console.log(url);
})();
// NOTE: pdf requires same domain or CORS!


// globals
var p;
var currPageNr = 1;
var numPages = 10000;
var zoom = 1;
var pageInPx = [0, 0];

var cvsEl = $('#cvs')
var ctx = cvsEl.getContext('2d');

var notes = {
	'1': [
		['highlight', 0.1, 0.2, 0.8, 0.6, 'rgba(255, 0, 255, 0.5)'],
		['takeNote', 'HELLO WORLD!', 0.1, 0.2, 0.04, '#000']
	],
	'3': [
		['highlight', 0.3, 0.2, 0.4, 0.6, 'rgba(255, 255, 0, 0.25)'],
		['takeNote', 'HI!', 0.1, 0.2, 0.2, 'blue', 'transparent']
	]
};


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
	ctx.fillStyle = clr
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

var renderNotes = function() {
	var pageNotes = notes[currPageNr];
	if (!pageNotes) { return; }
	var note, fnName, args;
	for (var i = 0, f = pageNotes.length; i < f; ++i) {
		args = pageNotes[i].slice();
		fnName = args.shift();
		//console.log(fnName, args);
		window[fnName].apply(window, args);
	}
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
