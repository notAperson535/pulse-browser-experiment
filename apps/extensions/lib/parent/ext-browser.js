/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check
/// <reference path="../types/index.d.ts" />

/** @type {typeof import('resource://app/modules/TypedImportUtils.sys.mjs')} */
const typedImportUtils = ChromeUtils.importESModule(
  'resource://app/modules/TypedImportUtils.sys.mjs',
)
const { lazyESModuleGetters } = typedImportUtils

const lazy = lazyESModuleGetters({
  WindowTracker: 'resource://app/modules/BrowserWindowTracker.sys.mjs',
  EBrowserActions: 'resource://app/modules/EBrowserActions.sys.mjs',
  EPageActions: 'resource://app/modules/EPageActions.sys.mjs',
  ExtensionParent: 'resource://gre/modules/ExtensionParent.sys.mjs',
})

class TabTracker extends TabTrackerBase {
  get activeTab() {
    const window = lazy.WindowTracker.getActiveWindow()
    return window?.activeTab()
  }

  init() {
    if (this.initialized) return
    this.initialized = true
  }

  /**
   * @param {import('@browser/tabs').WindowTab} nativeTab
   */
  getId(nativeTab) {
    return nativeTab.view.browserId || -1
  }

  /**
   * @template {import('@browser/tabs').WindowTab | null} T
   * @param {number} tabId
   * @param {T} default_
   * @returns {T}
   */
  getTab(tabId, default_) {
    const { tab } = lazy.WindowTracker.getWindowWithBrowserId(tabId) || {
      tab: default_,
    }

    return tab
  }

  /**
   * @param {import('resource://gre/modules/Extension.sys.mjs').Extension} extension
   * @param {import('@browser/tabs').WindowTab} tab
   * @param {Window} window
   *
   * @returns {tabs__tabs.Tab}
   */
  serializeTab(extension, tab, window) {
    // TODO: Active tab & host permissions
    const hasTabPermission = extension.hasPermission('tabs')

    return {
      id: tab.view.browserId,
      index: window.windowTabs().findIndex((wTab) => wTab === tab),
      active: window.activeTab() === tab,
      highlighted: false, // TODO
      title: (hasTabPermission && tab.view.title) || undefined,
      url: (hasTabPermission && tab.view.uri.asciiSpec) || undefined,
      windowId: window.windowId,
    }
  }

  /**
   * @param {XULBrowserElement} browser
   */
  getBrowserData(browser) {
    const data = lazy.WindowTracker.getWindowWithBrowser(browser)
    if (!data) return { windowId: -1, tabId: -1 }

    return {
      windowId: data.window.windowId,
      tabId: data.tab.view.browserId || -1,
    }
  }
}

/** @global */
let tabTracker = new TabTracker()
Object.assign(global, { tabTracker })
