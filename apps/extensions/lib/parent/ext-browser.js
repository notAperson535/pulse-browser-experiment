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

class Tab extends TabBase {
  get _favIconUrl() {
    return this.nativeTab.view.iconUrl
  }

  get lastAccessed() {
    return undefined
  }
  get audible() {
    return undefined
  }
  get autoDiscardable() {
    return false
  }
  get browser() {
    return this.nativeTab.view.browser
  }
  get cookieStoreId() {
    return undefined
  }
  get discarded() {
    return undefined
  }
  get height() {
    return this.nativeTab.view.browser.clientHeight
  }
  get hidden() {
    return false
  }
  get index() {
    const window = this.window
    return (
      window
        ?.windowTabs()
        .findIndex(
          (tab) => tab.view.browserId == this.nativeTab.view.browserId,
        ) || -1
    )
  }
  get mutedInfo() {
    return undefined
  }
  get sharingState() {
    return undefined
  }
  get pinned() {
    return false
  }
  get active() {
    const window = this.window
    return window?.activeTabId() == this.nativeTab.view.windowBrowserId
  }
  get highlighted() {
    const window = this.window
    return (
      window
        ?.selectedTabIds()
        .some((tab) => tab == this.nativeTab.view.windowBrowserId) ?? false
    )
  }
  get status() {
    return this.nativeTab.view.websiteState
  }
  get width() {
    return this.browser.clientWidth
  }
  get window() {
    return lazy.WindowTracker.getWindowWithBrowser(this.nativeTab.view.browser)
      ?.window
  }
  get windowId() {
    return this.window?.windowId || -1
  }
  get attention() {
    return false
  }
  get isArticle() {
    return false
  }
  get isInReaderMode() {
    return false
  }
  get successorTabId() {
    return undefined
  }
}

class TabManager extends TabManagerBase {
  canAccessTab(_nativeTab) {
    throw new Error('Method ')
  }
  get(tabId) {
    const results = lazy.WindowTracker.getWindowWithBrowserId(tabId)
    if (!results) return null
    return this.wrapTab(results.tab)
  }
  /**
   * @param {NativeTab} nativeTab
   */
  wrapTab(nativeTab) {
    return new Tab(this.extension, nativeTab, nativeTab.view.browserId || -1)
  }

  /**
   * @param {NativeTab} nativeTab
   * @public
   */
  publicWrapTab(nativeTab) {
    return this.wrapTab(nativeTab)
  }
}

extensions.on('startup', (type, extension) => {
  defineLazyGetter(extension, 'tabManager', () => new TabManager(extension))
})
