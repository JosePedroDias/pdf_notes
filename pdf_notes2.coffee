class PdfReader

    constructor: (@_uri, @_el, @_callbacks = {}) ->
        @_zoom = 1
        unless @_el?
            @_el = document.createElement 'canvas'
            document.body.appendChild @_el

        @_ctx = @_el.getContext '2d'

        @open()


    open: (uri) ->
        if uri? then @_uri = uri else uri = @_uri
        pr = @
        PDFJS.disableWorker = true
        PDFJS.getDocument(uri).then (pdf) ->
            pr._pdf = pdf
            pr._currPage = 1
            pr._numPages = pdf.numPages

            if pr._callbacks.onOpen then pr._callbacks.onOpen(pr)

            pr.toPage()


    toPage: (nr = @_currPage, isRelative) ->
        if isRelative
            @_currPage += nr
        else
            @_currPage = nr

        if @_currPage < 1 then @_currPage = 1
        else if @_currPage > @_numPages then @_currPage = @_numPages

        if @_callbacks.onPageChanged then @_callbacks.onPageChanged @

        @_pdf.getPage(@_currPage).then @_renderPage.bind(@)


    setZoom: (@_zoom) -> @toPage()

    getZoom: () -> @_zoom


    getNumberOfPages: () -> @_numPages

    getCurrentPage: () -> @_currPage

    toFirst: () -> @toPage(1)

    toLast: () -> @toPage(@_numPages)

    toNext: () -> @toPage(1, true)

    toPrevious: () -> @toPage(-1, true)


    _renderPage: (page) ->
        viewport = page.getViewport @_zoom
        pageInPx = [ viewport.width, viewport.height ]
        @_el.width  = pageInPx[0]
        @_el.height = pageInPx[1]

        page.render({canvasContext:@_ctx, viewport:viewport})#.then if @_callbacks.onRenderPage? then @_callbacks.onRenderPage @ else () -> {}



window.PdfReader = PdfReader
