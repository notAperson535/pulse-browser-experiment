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
   * @param {number} tabId
   * @param {import('@browser/tabs').WindowTab} default_
   */
  getTab(tabId, default_) {
    const { tab } = lazy.WindowTracker.getWindowWithBrowserId(tabId) || {
      tab: default_,
    }

    return tab
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

Object.assign(global, { tabTracker: new TabTracker() })
