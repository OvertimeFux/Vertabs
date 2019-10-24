(function () {
    const createElement = document.createElement.bind(document)

    var windowId

    const createLi = function (tab) {
        let li = createElement("li")

        li.innerHTML = `
            <div class="favicon">
                <img src="${tab.favIconUrl}">
            </div>
            ${tab.title}
        `

        li.classList.add("tab")

        return li
    }

    browser.windows.getCurrent().then((windowInfo) => {
        windowId = windowInfo.id
    })

    const $container = document.querySelector("#tabs")

    browser.tabs.query({windowId: windowId}).then((windowTabs) => {
        $container.textContent = ""
        windowTabs.forEach((tab) => {
            var li = createLi(tab)
            $container.appendChild(li)
        })
    })
})()
