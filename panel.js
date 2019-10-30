(function () {
    const createElement = document.createElement.bind(document)

    var windowId
    var tabsById = {}

    const renderPinnedTab = function (tab) {
        let html = createElement("button")
        html.classList.add("pinned-tab")
        html.src = tab.favIconUrl
        html.title = tab.title
        html.innerHTML = `<img class="favicon-pinned" src="${tab.favIconUrl}" title="${tab.title}">`

        return html
    }

    const renderTab = function (tab) {
        let html = createElement("div")
        html.title = tab.title
        html.classList.add("tab")
        if (tab.highlighted) {
            html.classList.add("highlighted")
        }

        if (tab.discarded) {
            html.classList.add("discarded")
        }

        html.innerHTML = `
            <img class="favicon" src="${tab.favIconUrl}">
            <div class="title" data-tabid="${tab.id}">${tab.title}</div>
        `

        return html
    }

    const $tabs = document.getElementById("tabs")
    const $pinnedTabs = document.getElementById("pinned-tabs")

    browser.windows.getCurrent().then((windowInfo) => {
        windowId = windowInfo.id
    }).then(function() {
        browser.tabs.query({windowId: windowId}).then((windowTabs) => {
            $tabs.textContent = ""

            windowTabs.forEach((tab) => {
                if (tab.pinned) {
                    let tabNode = renderPinnedTab(tab)
                    $pinnedTabs.appendChild(tabNode)
                } else {
                    let tabNode = renderTab(tab)
                    $tabs.appendChild(tabNode)
                }

                tabsById[tab.id] = tab
            })
        })
    })

    $tabs.addEventListener('click', function (e) {
        if (e.target && e.target.matches("div.title")) {
            let tabId = parseInt(e.target.dataset.tabid)
            browser.tabs.update(tabId, {active: true})
        }
    })

    document.addEventListener("contextmenu", event => event.preventDefault())
})()
