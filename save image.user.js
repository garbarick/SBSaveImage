// ==UserScript==
// @name         save image
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Serbis
// @include      /^https://.*reactor\.cc/.*$/
// @match        https://rule34.xxx/*
// @match        https://danbooru.donmai.us/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @run-at       document-idle
// ==/UserScript==

const sbSaveSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" stroke-width="3" fill="transparent" stroke="black">
    <path d="M4 8 L15 16 26 8 M4 16 L15 24 26 16"/>
</svg>`
const sbReloadSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" stroke-width="2" fill="transparent" stroke="black">
    <path d="M20 8 L26 8 26 2 M26 8 A12 12 0 0 0 6 22 A12 12 0 0 0 28 14"/>
</svg>`

GM_addStyle(`
.sb_base {
    background-color: wheat;
    border: 1px solid black;
    z-index: calc(9e999);
    cursor: pointer;
    align-items: center;
    justify-content: center;
    color: black;}
.sb_base:active {background-color: wheat;}
.sb_base:hover {background-color: white;}
#sb_save {
    position: absolute;
    display: none;
    background-image: url("data:image/svg+xml,${encodeURIComponent(sbSaveSvg)}");}
#sb_reload {
    position: absolute;
    display: none;
    background-image: url("data:image/svg+xml,${encodeURIComponent(sbReloadSvg)}");}
.sb_menu_item {
    position: fixed;
    display: flex;}
.sb_element {
    border: 1px solid black;
    display: flex !important;
    justify-content: center;
    align-items: center;}
`)

const sbButton =
{
    init : function()
    {
        this.urls = []
        this.initSave()
        this.initReload()
        this.initLoads()
        this.initStatus()
        this.initMenu()
        this.findImages()
        this.commets()
        this.initButtonsSize()
        this.initCreateListener()
    },

    getButton : function(id, title='', text='', classes=['sb_base'])
    {
        const button = document.createElement('div')
        button.id = id
        button.title = title
        button.innerText = text
        classes.forEach(e => button.classList.add(e))
        document.body.appendChild(button)
        return button
    },

    initSave : function()
    {
        this.save = this.getButton('sb_save', 'download')
        this.save.box = true
        this.save.addEventListener('click', () => this.saveImage())
    },

    initReload : function()
    {
        this.reload = this.getButton('sb_reload', 'reload')
        this.reload.box = true
        this.reload.addEventListener('click', this.reloadImage)
    },

    initStatus : function()
    {
        this.status = this.getButton('sb_status', 'reload downloads', 0, ['sb_base', 'sb_menu_item'])
        this.status.row = 0
        this.status.column = 0
        this.status.box = true
        this.status.addEventListener('click', () => this.reloadFrames())
        window.addEventListener('beforeunload', (event) => this.unload(event))
        for (var link of JSON.parse(GM_getValue('sbButton.links')))
        {
            this.doundloadImage(link)
        }
    },

    initMenu : function()
    {
        this.menu = this.getButton('sb_menu', 'menu', '...', ['sb_base', 'sb_menu_item'])
        this.menu.row = 1
        this.menu.box = true
        var subButton = this.getButton('sb_menu_find_images', '', 'find images', ['sb_base', 'sb_menu_item'])
        this.addSubMenu(this.menu, subButton, (event) => this.findImages(event))
        subButton = this.getButton('sb_menu_stop_unload', '', 'stop unload', ['sb_base', 'sb_menu_item'])
        this.addSubMenu(this.menu, subButton, (event) => this.stopUnload(event))
        subButton = this.getButton('sb_menu_clear_urls', '', 'clear urls', ['sb_base', 'sb_menu_item'])
        this.addSubMenu(this.menu, subButton, (event) => this.clearUrls(event))
        subButton = this.getButton('sb_menu_buttons_size', '', 'buttons size', ['sb_base', 'sb_menu_item'])
        this.addSubMenu(this.menu, subButton, (event) => this.buttonsSize(event))
        subButton = this.getButton('sb_menu_buttons_size_for_host', '', 'buttons size for host', ['sb_base', 'sb_menu_item'])
        this.addSubMenu(this.menu, subButton, (event) => this.buttonsSizeForHost(event))
        this.menu.addEventListener('click', () => this.menu.subMenu.forEach(e => e.style.display = e.style.display == '' ? 'none' : ''))
    },

    addSubMenu: function(button, subButton, subFunction)
    {
        const subMenu = button.subMenu || []
        subButton.style.display = 'none'
        subButton.row = subMenu.length + 1 + button.row
        subButton.column = 1
        subButton.addEventListener('click', (event) => {
            try {subFunction(event)} catch (e) {console.log(e.stack)}
            button.click()
        })
        subMenu.push(subButton)
        button.subMenu = subMenu
    },

    initLoads : function()
    {
        this.loads = this.getButton('sb_loads', 'loads', '', ['sb_base', 'sb_menu_item'])
        this.loads.column = 1
        this.loads.style.display = 'unset';
    },

    findImages : function()
    {
        var count = 0
        var obj
        /*reactor*/
        for (obj of document.querySelectorAll('div.image:not(.sb_image)'))
        {
            this.initImage(obj)
            count++
        }
        for (obj of document.querySelectorAll('img#fullResImage:not(.sb_image)'))
        {
            this.initImage(obj)
            count++
        }
        for (obj of document.querySelectorAll('a.prettyPhotoLink:not(.sb_find_image)'))
        {
            this.findImagesByClick(obj)
            count++
        }
        for (obj of document.querySelectorAll(`a[rel=nofollow][href*='redirect?']:not(.sb_element)`))
        {
            this.initNofollow(obj)
            count++
        }
        /*rule34.xxx*/
        for (obj of document.querySelectorAll('img#image:not(.sb_image)'))
        {
            this.initImage(obj)
            count++
        }
        for (obj of document.querySelectorAll('img.preview:not(.sb_for_open_background)'))
        {
            this.initForOpenBackground(obj)
            count++
        }
        /*danbooru.donmai.us*/
        for (obj of document.querySelectorAll('a.image-view-original-link:not(.sb_image)'))
        {
            this.initImage(obj)
            count++
        }
        for (obj of document.querySelectorAll('img.post-preview-image:not(.sb_for_open_background)'))
        {
            this.initForOpenBackground(obj)
            count++
        }
        if (count > 0)
        {
            console.log('findImages: ' + count)
        }
    },

    initImage : function(image)
    {
        if (image.classList.contains('sb_image'))
        {
            return
        }
        image.addEventListener('mouseenter', (event) => this.imageEnter(event))
        image.addEventListener('mouseleave', (event) => this.imageLeave(event))
        image.addEventListener('touchmove', (event) => this.imageEnter(event))
        image.classList.add('sb_image')
    },

    initForOpenBackground : function(image)
    {
        if (image.classList.contains('sb_for_open_background'))
        {
            return
        }
        var parent = image.parentElement
        if (parent.tagName != 'A')
        {
            parent = parent.parentElement
        }
        parent.target='_blank'
        image.classList.add('sb_for_open_background')
    },

    getName : function(src)
    {
        var file = decodeURI(src)
        file = file.split('/').pop().split('#').shift().split('?').shift()
        file = file.replace(/[^\p{L}\w\.]+/giu, '-')
        return file
    },

    createUrlElement : function(src)
    {
        var url = {}
        url.src = src
        url.name = this.getName(src)

        var link = document.createElement('a')
        link.href = url.src
        link.text = url.name
        link.style.display = 'block'
        this.loads.appendChild(link)
        url.link = link

        this.urls.push(url)
        this.status.innerText = this.urls.length
        return url
    },

    getNameWithSuffix : function(fileName, sub)
    {
        if (sub == null)
        {
            return fileName
        }
        var index = fileName.lastIndexOf('.')
        var name = fileName.substr(0, index)
        var ext = fileName.substr(index)
        return name + ' (' + sub + ')' + ext
    },

    doundloadImage : function(src, sub)
    {
        var url = this.createUrlElement(src)
        var fileName = this.getNameWithSuffix(url.name, sub)
        url.sub = sub
        url.load = GM_download({
            url: url.src,
            name: fileName,
            headers: {'Referer': document.location.href},
            onload: () => this.excludeLoadedImage(url),
            onerror: (error, detail) => this.failedImage(url, error, detail),
            onprogress: (data) => this.progressImage(url, data),
            conflictAction: 'overwrite'
        })
    },

    excludeLoadedImage : function(url)
    {
        var i = this.urls.indexOf(url)
        if (i > -1)
        {
            this.urls.splice(i, 1)
            console.log('excluded ' + url.src)
        }
        this.loads.removeChild(url.link)
        this.status.innerText = this.urls.length
    },

    failedImage : function(url, error, detail)
    {
        console.log('Downloading failed!\n' + url.name + '\n' + url.src + '\nerror:' + JSON.stringify(error) + '\ndetail:' + detail)
        if (error.details && 'USER_CANCELED' == error.details.current)
        {
            var sub = url.sub == null ? 1 : url.sub + 1
            this.excludeLoadedImage(url)
            this.doundloadImage(url.src, sub)
        }
        else
        {
            url.link.style.background = 'red'
        }
    },

    progressImage : function(url, data)
    {
        var loaded = Math.ceil(data.loaded * 100/data.total)
        url.link.style.background = 'linear-gradient(90deg, greenyellow ' + loaded + '%, wheat 0%)'
    },

    saveImage : function()
    {
        if (this.isNotEmpty(this.save.src))
        {
            this.doundloadImage(this.save.src)
        }
    },

    reloadImage : function()
    {
        for (var img of this.img)
        {
            console.log(img)
            if (img.tagName == 'VIDEO')
            {
                img.load()
            }
            else
            {
                img.src = img.src
            }
        }
    },

    isNotEmpty : function(value)
    {
        return typeof value == 'string' && value.length > 0
    },

    imageEnter : function(event)
    {
        event.stopPropagation()
        var link
        var img = []
        var src = event.currentTarget
        if (src.tagName == 'DIV')
        {
            src = src.firstElementChild
        }
        if (src.tagName == 'B')
        {
            src = src.firstElementChild
        }
        if (src.tagName == 'IMG')
        {
            link = src.src
            img.push(src)
        }
        else if (src.tagName == 'A' && this.isNotEmpty(src.style.backgroundImage))
        {
            link = src.style.backgroundImage.slice(4, -1).replace(/"/g, '')
        }
        else if (src.tagName == 'A' && this.isNotEmpty(src.href))
        {
            link = src.href
        }
        else if (src.tagName == 'SPAN' && src.className == 'video_gif_holder')
        {
            src = src.firstElementChild
            if (src.tagName == 'A')
            {
                var next = src.nextElementSibling
                if (next && next.tagName == 'IMG')
                {
                    src = next
                    link = src.src
                    img.push(src)
                }
                else if (next && next.tagName == 'VIDEO')
                {
                    link = src.href
                    img.push(next)
                }
                else
                {
                    link = src.href
                }
            }
            else
            {
                return
            }
        }
        else if (src.tagName == 'IFRAME')
        {
            return
        }
        else
        {
            console.log(src)
            return
        }
        if (src.tagName == 'A')
        {
            var srcImg = src.firstElementChild
            if (srcImg && srcImg.tagName == 'IMG')
            {
                img.push(srcImg)
            }
        }

        var rect = src.getBoundingClientRect()
        var topPosition = Math.max(rect.top + window.scrollY, window.scrollY)
        var leftPosition = rect.left + window.scrollX

        this.save.style.top = (topPosition + 5) + 'px'
        this.save.style.left = (leftPosition + 5) + 'px'
        this.save.style.display = 'block'
        this.save.src = link

        if (img.length > 0)
        {
            var size = this.getButtonsSize()
            this.reload.style.top = (topPosition + 5) + 'px'
            this.reload.style.left = (leftPosition + size + 8) + 'px'
            this.reload.style.display = 'block'
            this.reload.img = img
        }
    },

    imageLeave : function(event)
    {
        event.stopPropagation()
        if (event.relatedTarget != this.save &&
            event.relatedTarget != this.reload)
        {
            this.save.style.display = 'none'
            this.reload.style.display = 'none'
        }
    },

    reloadFrames : function()
    {
        var urls = this.urls
        this.urls = []
        for (var url of urls)
        {
            url.load.abort()
            this.loads.removeChild(url.link)
            this.doundloadImage(url.src)
        }
    },

    unload : function(event)
    {
        event.stopPropagation()
        var urls = []
        for (var url of this.urls)
        {
            try {url.load.abort() } catch (e) {}
            urls.push(url.src)
        }
        GM_setValue('sbButton.links', JSON.stringify(urls))
        if (urls.length > 0 && GM_getValue('sbButton.stopUnload'))
        {
            event.preventDefault()
            event.returnValue = 'no all images were loaded'
            return event.returnValue
        }
    },

    stopUnload : function()
    {
        if (confirm('stop unload if images was not downloaded?'))
        {
            GM_setValue('sbButton.stopUnload', 1)
        }
        else
        {
            GM_setValue('sbButton.stopUnload', 0)
        }
    },

    clearUrls : function()
    {
        GM_setValue('sbButton.links', JSON.stringify([]))
        this.urls = []
    },

    commets : function()
    {
        for (var comment of document.querySelectorAll('a.toggleComments'))
        {
            this.findImagesByClick(comment)
        }
    },

    initNofollow : function(obj)
    {
        if (obj.classList.contains('sb_element'))
        {
            return
        }
        var url = new URL(obj.href)
        var params = new URLSearchParams(url.search)
        obj.href = params.get('url')
        obj.classList.add('sb_element')
        obj.target = '_blank'
        obj.innerText = (obj.innerText.replace(obj.href, '') + ' ' + obj.href).trim()
    },

    getButtonsSize : function()
    {
        const host = window.location.host
        var size = GM_getValue('sbButton.buttonsSize-' + host)
        if (this.isNotEmpty(size))
        {
            return parseInt(size)
        }
        size = GM_getValue('sbButton.buttonsSize')
        if (this.isNotEmpty(size))
        {
            return parseInt(size)
        }
        return 32
    },

    setButtonSize: function(button, size, bgSize)
    {
        button.style.height = size + 'px'
        if (button.box)
        {
            button.style.width = size + 'px'
        }
        button.style.backgroundSize = bgSize + 'px ' + bgSize + 'px'
        const subMenu = button.subMenu || []
        subMenu.forEach(e => this.setButtonSize(e, size, bgSize))
    },

    setButtonPlace: function(button, size)
    {
        const row = button.row || 0
        const column = button.column || 0
        button.style.bottom = (size + 1) * row + 'px'
        button.style.right = (size + 1) * column + 'px'
        const subMenu = button.subMenu || []
        subMenu.forEach(e => this.setButtonPlace(e, size))
    },

    setFontSize: function(button, size)
    {
        button.style.fontSize = size + 'px'
        const subMenu = button.subMenu || []
        subMenu.forEach(e => this.setFontSize(e, size))
    },

    initButtonsSize : function()
    {
        const size = this.getButtonsSize()
        const bgSize = size - 2
        const fSize = Math.floor(size / 1.5)
        const sSize = Math.floor(size / 2)

        this.setButtonSize(this.save, size, bgSize)
        this.setButtonSize(this.reload, size, bgSize)
        this.setButtonSize(this.status, size, bgSize)
        this.setButtonPlace(this.status, size)
        this.setFontSize(this.status, fSize)
        this.setButtonSize(this.menu, size, bgSize)
        this.setButtonPlace(this.menu, size)
        this.setFontSize(this.menu, fSize)
        this.setButtonPlace(this.loads, size)
        this.setFontSize(this.loads, sSize)

        const buttons = [
            ...document.querySelectorAll('div.post_content_expand'),
            ...document.querySelectorAll('a.toggleComments'),
            ...document.querySelectorAll('a.next'),
            ...document.querySelectorAll('a.prev'),
            ...document.querySelectorAll('a.sb_element')]
        buttons.forEach(e =>
        {
            e.style.height = size + 'px'
            if (e.offsetParent != null && !e.classList.contains('sb_element'))
            {
                e.classList.add('sb_element')
            }
        })
    },

    buttonsSize : function()
    {
        var size = prompt('Select button size', this.getButtonsSize())
        if (size != null)
        {
            GM_setValue('sbButton.buttonsSize', size)
            this.initButtonsSize()
        }
    },

    buttonsSizeForHost : function()
    {
        const host = window.location.host
        var size = prompt('Select button size for host ' + host, this.getButtonsSize())
        if (size != null)
        {
            GM_setValue('sbButton.buttonsSize-' + host, size)
            this.initButtonsSize()
        }
    },

    findImagesByClick : function(item)
    {
        if (item.classList.contains('sb_find_image'))
        {
            return
        }
        item.addEventListener('click', () => setTimeout(() => this.findImages(), 2000))
        item.classList.add('sb_find_image')
    },

    initCreateListener : function()
    {
        setInterval(() => {
            this.findImages()
            this.initButtonsSize()
        }, 2000)
    }
}

try {sbButton.init()} catch (e) {console.log(e.stack)}
