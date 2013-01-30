// Generated by CoffeeScript 1.4.0
(function() {
  var $, currPageEl, cvsEl, firstPBEl, lastPBEl, nextPBEl, numPagesEl, pr, previousPBEl;

  $ = function(sel) {
    return document.querySelector(sel);
  };

  cvsEl = $('#cvs');

  firstPBEl = $('#firstPB');

  previousPBEl = $('#previousPB');

  nextPBEl = $('#nextPB');

  lastPBEl = $('#lastPB');

  currPageEl = $('#currPage');

  numPagesEl = $('#numPages');

  pr = new PdfReader('test.pdf', cvsEl, {
    onOpen: function(pr) {
      var np;
      np = pr.getNumberOfPages();
      currPageEl.setAttribute('max', np);
      return numPagesEl.innerHTML = np;
    },
    onPageChanged: function(pr) {
      var cp;
      cp = pr.getCurrentPage();
      return currPageEl.value = cp;
    },
    onRenderPage: function(pr) {}
  });

  firstPBEl.addEventListener('click', function() {
    return pr.toFirst();
  });

  previousPBEl.addEventListener('click', function() {
    return pr.toPrevious();
  });

  nextPBEl.addEventListener('click', function() {
    return pr.toNext();
  });

  lastPBEl.addEventListener('click', function() {
    return pr.toLast();
  });

}).call(this);