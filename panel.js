(function () {
    const createElement = document.createElement.bind(document)

    var windowId

    let state = {
        tabsById: {},
        removeTabEvent: function (tabId, removeInfo) {
            let tab = this.tabsById[tabId]
            tab.tabNode.remove()
            delete this.tabsById[tabId]
        },
        createTabEvent: function (tab) {
            let tabNode = renderTab(tab)
            $tabs.appendChild(tabNode)
            this.tabsById[tab.id] = {
                apiTab: tab,
                tabNode: tabNode
            }
        },
        changeTabEvent: function(tabId, changeInfo, tab) {
            // TODO: "attention" "audible" "discarded" "favIconUrl" "hidden" "isArticle" "mutedInfo" "pinned" "sharingState" "status" "title"
            console.log(tab.title)
            let tabNode = this.tabsById[tabId].tabNode
            tabNode.querySelector("img.favicon").src = tab.favIconUrl
            tabNode.querySelector("div.title").innerHTML = tab.title
        }
    }

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
                let tabNode
                if (tab.pinned) {
                    let tabNode = renderPinnedTab(tab)
                    $pinnedTabs.appendChild(tabNode)
                } else {
                    let tabNode = renderTab(tab)
                    $tabs.appendChild(tabNode)
                }

                state.tabsById[tab.id] = {
                    apiTab: tab,
                    tabNode: tabNode
                }
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
    
    browser.tabs.onRemoved.addListener(state.removeTabEvent.bind(state))
    browser.tabs.onCreated.addListener(state.createTabEvent.bind(state))
    browser.tabs.onUpdated.addListener(state.changeTabEvent.bind(state), {
        properties: ["title", "favIconUrl"]
    })
})()
