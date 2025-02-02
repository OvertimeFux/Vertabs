(function() {
  const createElement = document.createElement.bind(document);

  let windowId;
  const $tabs = document.getElementById("tabs");
  const $pinnedTabs = document.getElementById("pinned-tabs");
  const $scrollTop = document.getElementById("scroll-top");
  const $scrollBottom = document.getElementById("scroll-bottom");

  let state = {
    tabsById: {},
    removeTabEvent: function(tabId, removeInfo) {
      let tab = this.tabsById[tabId];
      tab.tabNode.remove();
      delete this.tabsById[tabId];
    },
    createTabEvent: function(tab) {
      let tabNode = renderTab(tab);
      this.tabsById[tab.id] = {
        apiTab: tab,
        tabNode: tabNode
      };

      browser.tabs.query({ index: tab.index + 1 }).then(windowTabs => {
        let nextTab = windowTabs[0];
        if (nextTab) {
          let nextTabNode = this.tabsById[nextTab.id].tabNode;
          $tabs.insertBefore(tabNode, nextTabNode);
        } else {
          $tabs.appendChild(tabNode);
        }
        scrollToViewTab(tab.id);
      });
    },
    changeTabIconAndTitle: function(tabId, changeInfo, tab) {
      // TODO: "attention" "audible" "discarded" "favIconUrl" "hidden" "isArticle" "mutedInfo" "pinned" "sharingState" "status" "title"
      let bothTabs = this.tabsById[tabId];
      if (bothTabs) {
        let tabNode = bothTabs.tabNode;
        if (tab.pinned) {
          let favicon = tabNode.querySelector("img.favicon-pinned");
          favicon.src = getFavicon(tab);
          favicon.setAttribute("title", tab.title);
        } else {
          tabNode.querySelector("img.favicon").src = getFavicon(tab);
          tabNode.querySelector("div.title").innerHTML = tab.title;
        }
      }
    },
    pinUnpinTabEvent: function(tabId, changeInfo, tab) {
      this.tabsById[tabId].tabNode.remove();

      let tabNode = null;
      if (changeInfo.pinned) {
        tabNode = renderPinnedTab(tab);
        $pinnedTabs.appendChild(tabNode);
      } else {
        tabNode = renderTab(tab);
        $tabs.appendChild(tabNode);
      }

      this.tabsById[tabId].tabNode = tabNode;
    },
    loadUnloadTabEvent: function(tabId, changeInfo, tab) {
      let tabNode = this.tabsById[tabId].tabNode;

      if (changeInfo.discarded) {
        tabNode.classList.add("discarded");
      } else {
        tabNode.classList.remove("discarded");
      }
    },
    setActiveTabEvent: function(activeInfo) {
      let tabNode = this.tabsById[activeInfo.tabId].tabNode;
      if (activeInfo.previousTabId) {
        let prevActiveNode = this.tabsById[activeInfo.previousTabId].tabNode;
        prevActiveNode.classList.remove("highlighted");
      }

      tabNode.classList.add("highlighted");

      scrollToViewTab(activeInfo.tabId);
    },
    checkSoundStatus: function(tabId) {
      console.log(tabId);
    }
  };

  const scrollToViewTab = function(tabId) {
    let tab = state.tabsById[tabId];
    let tabNode = tab.tabNode;

    let visibleTopY = window.scrollY;
    let visibleBottomY = visibleTopY + window.innerHeight;
    let sizingInfo = tabNode.getBoundingClientRect();
    let tabTopY = sizingInfo.y + window.scrollY;
    let tabBottomY = sizingInfo.y + window.scrollY + sizingInfo.height;

    if (tabBottomY > visibleBottomY) {
      tabNode.scrollIntoView({ behavior: "smooth", block: "end" });
    } else if (tabTopY < visibleTopY) {
      tabNode.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderPinnedTab = function(tab) {
    let html = createElement("button");
    html.classList.add("pinned-tab");
    html.setAttribute("data-tabid", tab.id);
    html.title = tab.title;
    html.innerHTML = `<img class="favicon-pinned" src="${getFavicon(
      tab
    )}" title="${tab.title}">`;

    return html;
  };

  const getFavicon = function(tab) {
    return tab.favIconUrl !== undefined
      ? tab.favIconUrl
      : "icons/dark/history_Item.svg";
  };

  const renderTab = function(tab) {
    console.log(tab);
    let html = createElement("div");
    html.title = tab.title;
    html.classList.add("tab");
    html.setAttribute("data-tabid", tab.id);
    if (tab.highlighted) {
      html.classList.add("highlighted");
    }

    if (tab.discarded) {
      html.classList.add("discarded");
    }

    html.innerHTML = `
        <img class="favicon" src="${getFavicon(tab)}">
        <span class="title">${tab.title}</span>
        <div class="tab-status">
          ${audibleState(tab.audible)}
        </div>
        <div class="tab-control">
            <i class="fa fa-fw fa-times" data-id="${tab.id}"></i>
        </div>
        <div class="fade"></div>
      `;
    return html;
  };

  const audibleState = function(state) {
    console.log(state);
    if (!state) {
      return "";
    } else {
      return `<i class="fa fa-fw fa-volume-up"></i>`;
    }
  };

  browser.windows
    .getCurrent()
    .then(windowInfo => {
      windowId = windowInfo.id;
    })
    .then(function() {
      browser.tabs.query({ windowId: windowId }).then(windowTabs => {
        $tabs.textContent = "";

        windowTabs.forEach(tab => {
          let tabNode;
          if (tab.pinned) {
            tabNode = renderPinnedTab(tab);
            $pinnedTabs.appendChild(tabNode);
          } else {
            tabNode = renderTab(tab);
            $tabs.appendChild(tabNode);
          }

          state.tabsById[tab.id] = {
            apiTab: tab,
            tabNode: tabNode
          };
        });
      });
    });

  $tabs.addEventListener("scroll", function(e) {
    let target = e.target;
    let pos = target.scrollTop;
    let max = target.scrollHeight - target.clientHeight;
    let percent = Number((pos / max).toFixed(1));

    console.debug(percent);

    switch (percent) {
      case 0.0:
        $scrollTop.style.display = "none";
        $scrollBottom.style.display = "block";
        break;
      case 0.1:
      case 0.9:
        break;
      case 1.0:
        $scrollBottom.style.display = "none";
        $scrollTop.style.display = "block";
        break;
      default:
        $scrollTop.style.display = "block";
        $scrollBottom.style.display = "block";
    }
  });

  $scrollTop.addEventListener("click", function(e) {
    $tabs.scrollTop = 0;
  });

  $scrollBottom.addEventListener("click", function(e) {
    $tabs.scrollTop = $tabs.scrollHeight;
  });

  $tabs.addEventListener("click", function(e) {
    console.debug("Click on:", e.target);

    if (e.target) {
      let tabId;

      if (e.target.matches("div.tab")) {
        tabId = parseInt(e.target.dataset.tabid);
      }

      if (e.target.parentElement.matches("div.tab")) {
        tabId = parseInt(e.target.parentElement.dataset.tabid);
      }

      browser.tabs.update(tabId, { active: true });
    }
  });

  $pinnedTabs.addEventListener("click", function(e) {
    console.debug("Click on:", e.target);

    if (e.target) {
      let tabId;

      if (e.target.matches("button.pinned-tab")) {
        tabId = parseInt(e.target.dataset.tabid);
      }

      if (e.target.parentElement.matches("button.pinned-tab")) {
        tabId = parseInt(e.target.parentElement.dataset.tabid);
      }

      browser.tabs.update(tabId, { active: true });
    }
  });

  document.addEventListener("contextmenu", event => event.preventDefault());

  browser.tabs.onRemoved.addListener(state.removeTabEvent.bind(state));
  browser.tabs.onDetached.addListener(state.removeTabEvent.bind(state));
  browser.tabs.onCreated.addListener(state.createTabEvent.bind(state));
  browser.tabs.onActivated.addListener(state.setActiveTabEvent.bind(state));
  browser.tabs.onUpdated.addListener(state.changeTabIconAndTitle.bind(state), {
    properties: ["title", "favIconUrl"]
  });
  browser.tabs.onUpdated.addListener(state.pinUnpinTabEvent.bind(state), {
    properties: ["pinned"]
  });
  browser.tabs.onUpdated.addListener(state.loadUnloadTabEvent.bind(state), {
    properties: ["discarded"]
  });
})();
