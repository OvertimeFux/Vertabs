(function () {
    const createElement = document.createElement.bind(document)

    var windowId
    const $tabs = document.getElementById("tabs")
    const $pinnedTabs = document.getElementById("pinned-tabs")

    let state = {
        tabsById: {},
        removeTabEvent: function (tabId, removeInfo) {
            let tab = this.tabsById[tabId]
            tab.tabNode.remove()
            delete this.tabsById[tabId]
        },
        createTabEvent: function (tab) {
            let tabNode = renderTab(tab)
            this.tabsById[tab.id] = {
                apiTab: tab,
                tabNode: tabNode
            }

            browser.tabs.query({index: tab.index + 1}).then((windowTabs) => {
                let nextTab = windowTabs[0]
                if (nextTab) {
                    let nextTabNode = this.tabsById[nextTab.id].tabNode
                    $tabs.insertBefore(tabNode, nextTabNode)
                } else {
                    $tabs.appendChild(tabNode)
                }
            })
        },
        changeTabIconAndTitle: function(tabId, changeInfo, tab) {
            // TODO: "attention" "audible" "discarded" "favIconUrl" "hidden" "isArticle" "mutedInfo" "pinned" "sharingState" "status" "title"
            let bothTabs = this.tabsById[tabId]
            if (bothTabs) {
                let tabNode = bothTabs.tabNode
                if (tab.pinned) {
                    let favicon = tabNode.querySelector("img.favicon-pinned")
                    favicon.src = tab.favIconUrl
                    favicon.setAttribute("title", tab.title)
                } else {
                    tabNode.querySelector("img.favicon").src = tab.favIconUrl
                    tabNode.querySelector("div.title").innerHTML = tab.title
                }
            }
        },
        setActiveTabEvent: function(activeInfo) {
            let tabNode = this.tabsById[activeInfo.tabId].tabNode
            if (activeInfo.previousTabId) {
                let prevActiveNode = this.tabsById[activeInfo.previousTabId].tabNode
                prevActiveNode.classList.remove("highlighted")
                tabNode.classList.add("highlighted")
            }
        }
    }

    const renderPinnedTab = function (tab) {
        let html = createElement("button")
        html.classList.add("pinned-tab")
        html.setAttribute('data-tabid', tab.id)
        html.src = tab.favIconUrl
        html.title = tab.title
        html.innerHTML = `<img class="favicon-pinned" src="${tab.favIconUrl}" title="${tab.title}">`

        return html
    }

    const renderTab = function (tab) {
        let html = createElement("div")
        html.title = tab.title
        html.classList.add("tab")
        html.setAttribute('data-tabid', tab.id)
        if (tab.highlighted) {
            html.classList.add("highlighted")
        }

        if (tab.discarded) {
            html.classList.add("discarded")
        }

        html.innerHTML = `
            <img class="favicon" src="${tab.favIconUrl}">
            <div class="title">${tab.title}</div>
        `

        return html
    }

    browser.windows.getCurrent().then((windowInfo) => {
        windowId = windowInfo.id
    }).then(function() {
        browser.tabs.query({windowId: windowId}).then((windowTabs) => {
            $tabs.textContent = ""

            windowTabs.forEach((tab) => {
                let tabNode
                if (tab.pinned) {
                    tabNode = renderPinnedTab(tab)
                    $pinnedTabs.appendChild(tabNode)
                } else {
                    tabNode = renderTab(tab)
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
        if (e.target) {
            let tabId

            if (e.target.matches("div.tab")) {
                tabId = parseInt(e.target.dataset.tabid)
            }
    
            if (e.target.parentElement.matches("div.tab")) {
                tabId = parseInt(e.target.parentElement.dataset.tabid)
            }
    
            browser.tabs.update(tabId, {active: true})
        }
    })

    $pinnedTabs.addEventListener('click', function (e) {
        if (e.target) {
            let tabId
            
            if (e.target.matches("button.pinned-tab")) {
                tabId = parseInt(e.target.dataset.tabid)
            }
    
            if (e.target.parentElement.matches("button.pinned-tab")) {
                tabId = parseInt(e.target.parentElement.dataset.tabid)
            }
    
            browser.tabs.update(tabId, {active: true})
        }
    })

    document.addEventListener("contextmenu", event => event.preventDefault())
    
    browser.tabs.onRemoved.addListener(state.removeTabEvent.bind(state))
    browser.tabs.onCreated.addListener(state.createTabEvent.bind(state))
    browser.tabs.onActivated.addListener(state.setActiveTabEvent.bind(state))
    browser.tabs.onUpdated.addListener(state.changeTabIconAndTitle.bind(state), {
        properties: ["title", "favIconUrl"]
    })
})()
