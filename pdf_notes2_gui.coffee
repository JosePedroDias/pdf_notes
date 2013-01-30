$ = (sel) -> document.querySelector sel



cvsEl = $('#cvs')

firstPBEl    = $('#firstPB')
previousPBEl = $('#previousPB')
nextPBEl     = $('#nextPB')
lastPBEl     = $('#lastPB')

currPageEl   = $('#currPage')
numPagesEl   = $('#numPages')

zoomSelEl    = $('#zoomSelEl')



pr = new PdfReader('test.pdf', cvsEl,
    onOpen: (pr) ->
        np = pr.getNumberOfPages()
        currPageEl.setAttribute 'max', np
        numPagesEl.innerHTML = np

    onPageChanged: (pr) ->
        cp = pr.getCurrentPage()
        currPageEl.value = cp

    onRenderPage: (pr) ->
)

firstPBEl.addEventListener 'click', () -> pr.toFirst()
previousPBEl.addEventListener 'click', () -> pr.toPrevious()
nextPBEl.addEventListener 'click', () -> pr.toNext()
lastPBEl.addEventListener 'click', () -> pr.toLast()

zooms = ['50%', '75%', '100%', '150%', '200%']
for z in zooms
    o = document.createElement 'option'
    zoomSelEl.appendChild


