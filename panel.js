(function () {
    const createElement = document.createElement.bind(document)

    var windowId

    const renderPinnedTab = function (tab) {
        let html = createElement("img")
        html.classList.add("favicon-pinned")
        html.src = tab.favIconUrl
        html.title = tab.title

        return html
    }

    const renderTab = function (tab) {
        let html = createElement("div")
        html.title = tab.title
        html.classList.add("tab")

        html.innerHTML = `
            <img class="favicon" src="${tab.favIconUrl}">
            <div class="title">${tab.title}</div>
        `

        return html
    }

    browser.windows.getCurrent().then((windowInfo) => {
        windowId = windowInfo.id
    })

    const $tabs = document.getElementById("tabs")
    const $pinnedTabs = document.getElementById("pinned-tabs")

    browser.tabs.query({windowId: windowId}).then((windowTabs) => {
        $tabs.textContent = ""
        $pinnedTabs.textContent = ""

        windowTabs.forEach((tab) => {
            if (tab.pinned) {
                let tabNode = renderPinnedTab(tab)
                $pinnedTabs.appendChild(tabNode)
            } else {
                let tabNode = renderTab(tab)
                $tabs.appendChild(tabNode)
            }
        })
    })
})()