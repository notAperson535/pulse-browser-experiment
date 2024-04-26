/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check
/// <reference path="../types/index.d.ts"  />
/// <reference path="./ext-browser.js"  />
/// <reference types="@browser/link" />

this.tabs = class extends ExtensionAPIPersistent {
  PERSISTENT_EVENTS = {}

  /**
   * @param {BaseContext} context
   * @returns {tabs__tabs.ApiGetterReturn}
   */
  getAPI(context) {
    const { extension } = context

    /**
     * @param {number} tabId
     */
    async function get(tabId) {
      const tab = extension.tabManager.get(tabId)

      if (!tab) {
        return Promise.reject({
          message: `Cannot find tab matching the id ${tabId}`,
        })
      }

      return tab
    }

    /**
     * @param {number} [tabId]
     */
    async function getTabOrActive(tabId) {
      /** @type {TabBase} */
      let tab

      if (tabId) {
        tab = extension.tabManager.get(tabId)
      } else {
        const nativeTab = lazy.WindowTracker.getActiveWindow()?.activeTab()
        if (!nativeTab) {
          return Promise.reject({
            message: 'Could not find active tab',
          })
        }
        tab = extension.tabManager.publicWrapTab(nativeTab)
      }

      return tab
    }

    return {
      tabs: {
        async get(tabId) {
          const tab = await get(tabId)
          return tab.convert()
        },

        async goBack(tabId) {
          const tab = await getTabOrActive(tabId)
          tab.browser.goBack()
        },

        async goForward(tabId) {
          const tab = await getTabOrActive(tabId)
          tab.browser.goForward()
        },

        async query(queryInfo) {
          return Array.from(extension.tabManager.query(queryInfo, context)).map(
            (tab) => tab.convert(),
          )
        },

        async remove(tabSelector) {
          const tabIds =
            typeof tabSelector == 'number' ? [tabSelector] : tabSelector

          const windows = [...lazy.WindowTracker.registeredWindows.entries()]

          for (const window of windows.map((w) => w[1])) {
            const tabs = window.windowTabs()

            if (tabs.some((tab) => tabIds.includes(tab.view.browserId || -1))) {
              window.windowTabs.update((tabs) =>
                tabs.filter(
                  (tab) => !tabIds.includes(tab.view.browserId || -1),
                ),
              )
            }
          }
        },

        async reload(tabSelector) {
          const tabIds =
            typeof tabSelector == 'number' ? [tabSelector] : tabSelector

          await Promise.all(
            tabIds
              .map((id) => get(id))
              .map((tab) => tab.then((tab) => tab.browser.reload())),
          )
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
            /** @type {import("@browser/tabs").WindowTab | undefined} */
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
              const tab = extension.tabManager.getWrapper(retTab)
              return tab?.convert()
            }

            return
          }
        },
      },
    }
  }
}
