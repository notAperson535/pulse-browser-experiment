/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check
/// <reference path="../types/index.d.ts"  />
/// <reference path="./ext-browser.js"  />
/// <reference path="../schemaTypes/tabs.d.ts"  />

/**
 * @param {tabs__tabs.QueryInfo} queryInfo
 * @returns {[import("@browser/tabs").WindowTab, Window][]}
 */
function query(queryInfo) {
  const windows = [...lazy.WindowTracker.registeredWindows.entries()]

  const urlMatchSet =
    (queryInfo.url &&
      (Array.isArray(queryInfo.url)
        ? new MatchPatternSet(queryInfo.url)
        : new MatchPatternSet([queryInfo.url]))) ||
    null

  return windows.flatMap(([windowId, window]) => {
    const tabs = window.windowTabs()
    const activeTab = window.activeTab()

    return tabs
      .filter((tab) => {
        const active =
          queryInfo.active !== null
            ? queryInfo.active
              ? tab === activeTab
              : tab !== activeTab
            : true
        const title = queryInfo.title
          ? queryInfo.title === tab.view.title
          : true
        const url =
          urlMatchSet === null
            ? true
            : urlMatchSet.matches(tab.view.uri.asciiSpec)
        const window =
          queryInfo.windowId === null ? true : queryInfo.windowId === windowId

        return active && title && url && window
      })
      .map(
        /** @returns {[import("@browser/tabs").WindowTab, Window]} */ (tab) => [
          tab,
          window,
        ],
      )
  })
}

const serialize =
  (extension) =>
  /**
   * @param {[import("@browser/tabs").WindowTab, Window]} in
   * @returns {tabs__tabs.Tab}
   */
  ([tab, window]) => {
    // TODO: Active tab & host permissions
    const hasTabPermission = extension.hasPermission('tabs')

    return {
      id: tab.view.browserId,
      index: window.windowTabs().findIndex((wTab) => wTab === tab),
      active: window.activeTab() === tab,
      highlighted: false, // TODO
      title: hasTabPermission && tab.view.title,
      url: hasTabPermission && tab.view.uri.asciiSpec,
      windowId: window.windowId,
    }
  }

this.tabs = class extends ExtensionAPIPersistent {
  PERSISTENT_EVENTS = {}

  /**
   * @returns {tabs__tabs.ApiGetterReturn}
   */
  getAPI(context) {
    const { extension } = context

    /**
     * @param {number} tabId
     */
    async function get(tabId) {
      const window = [...lazy.WindowTracker.registeredWindows.values()].find(
        (window) =>
          window.windowTabs().some((tab) => tab.view.browserId === tabId),
      )

      if (!window) {
        return Promise.reject({
          message: `Cannot find tab matching the id ${tabId}`,
        })
      }

      const tab = window
        .windowTabs()
        .find((tab) => tab.view.browserId === tabId)

      if (!tab) {
        return Promise.reject({
          message: `Cannot find tab matching the id ${tabId}`,
        })
      }

      return { tab, window }
    }

    return {
      tabs: {
        async get(tabId) {
          const { tab, window } = await get(tabId)
          return serialize(extension)([tab, window])
        },

        async goBack(tabId) {
          let tab

          if (tabId) {
            tab = await get(tabId).then((all) => all.tab)
          } else {
            tab = lazy.WindowTracker.getActiveWindow()?.activeTab()
            if (!tab) {
              return
            }
          }
          const complete = new Promise((res) => {
            /** @param {boolean} isLoading  */
            function complete(isLoading) {
              if (isLoading) {
                return
              }
              tab.view.events.off('loadingChange', complete)
              res(undefined)
            }

            tab.view.events.on('loadingChange', complete)
          })
          tab.view.browser.goBack()
          return complete
        },

        async goForward(tabId) {
          let tab

          if (tabId) {
            tab = await get(tabId).then((all) => all.tab)
          } else {
            tab = lazy.WindowTracker.getActiveWindow()?.activeTab()
            if (!tab) {
              return
            }
          }

          const complete = new Promise((res) => {
            /** @param {boolean} isLoading  */
            function complete(isLoading) {
              if (isLoading) {
                return
              }
              tab.view.events.off('loadingChange', complete)
              res(undefined)
            }

            tab.view.events.on('loadingChange', complete)
          })
          tab.view.browser.goForward()
          return complete
        },

        async query(queryInfo) {
          return query(queryInfo).map(serialize(extension))
        },

        async remove(tabIds) {
          const windows = [...lazy.WindowTracker.registeredWindows.entries()]

          if (typeof tabIds === 'number') {
            for (const window of windows.map((w) => w[1])) {
              const tabs = window.windowTabs()
              for (const tab of tabs) {
                if (tab.view.browserId === tabIds) {
                  return window.windowTabs.update((tabs) =>
                    tabs.filter((tab) => tab.view.browserId !== tabIds),
                  )
                }
              }
            }

            return
          }

          for (const window of windows.map((w) => w[1])) {
            const tabs = window.windowTabs()
            for (const tab of tabs) {
              if (tabIds.includes(tab.view.browserId || -1)) {
                window.windowTabs.update((tabs) =>
                  tabs.filter(
                    (tab) => !tabIds.includes(tab.view.browserId || -1),
                  ),
                )
                break
              }
            }
          }
        },

        async reload(tabIds) {
          if (typeof tabIds === 'number') {
            const { tab } = await get(tabIds)
            tab.view.browser.reload()
            return
          }

          for (const id of tabIds) {
            const { tab } = await get(id)
            tab.view.browser.reload()
          }
        },

        async update(tabId, updateProperties) {
          const windows = lazy.WindowTracker.registeredWindows.values()
          for (const window of windows) {
            const tabs = window.windowTabs()
            const hasTab = tabs.some((tab) => tab.view.browserId === tabId)

            if (!hasTab) {
              continue
            }

            let errors = null
            let retTab

            window.windowTabs.update((tabs) =>
              tabs.map((tab) => {
                if (tab.view.browserId === tabId) {
                  if (updateProperties.active) {
                    window.activeTabId.set(tab.view.windowBrowserId)
                  }

                  if (
                    updateProperties.highlighted &&
                    window.activeTabId() !== tab.view.windowBrowserId
                  ) {
                    window.selectedTabIds.update((tabs) => {
                      if (tabs.includes(tab.view.windowBrowserId)) return tabs
                      return [...tabs, tab.view.windowBrowserId]
                    })
                  }

                  if (updateProperties.url) {
                    let url = context.uri.resolve(updateProperties.url)

                    if (
                      !context.checkLoadURL(url, { dontReportErrors: true })
                    ) {
                      errors = `Invalid url: ${url}`
                      return tab
                    }

                    tab.view.events.emit('goTo', url)
                  }

                  retTab = tab
                }

                return tab
              }),
            )

            if (errors) {
              return Promise.reject({ message: errors })
            }

            if (retTab) {
              return serialize(extension)([retTab, window])
            }

            return
          }
        },
      },
    }
  }
}
