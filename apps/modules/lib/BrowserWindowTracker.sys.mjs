/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/// @ts-check
/// <reference types="@browser/link" />
import mitt from 'resource://app/modules/mitt.sys.mjs'

/** @type {import('resource://app/modules/BrowserWindowTracker.sys.mjs')['WindowTracker']} */
export const WindowTracker = {
  /**
   * 1 indexed to stop having a falsey window id
   */
  nextWindowId: 1,

  events: mitt(),

  activeWindow: null,
  registeredWindows: new Map(),

  /**
   * Registers a new browser window to be tracked
   *
   * @param w The window to register
   */
  registerWindow(w) {
    w.windowId = this.nextWindowId++
    this.registeredWindows.set(w.windowId, w)
    this.events.emit('windowCreated', w)
  },

  removeWindow(w) {
    this.registeredWindows.delete(w.windowId)
    this.events.emit('windowDestroyed', w)
  },

  getWindowById(wid) {
    return this.registeredWindows.get(wid)
  },

  getWindowWithBrowserId(browserId) {
    for (const window of this.registeredWindows.values()) {
      const tab = window
        .windowTabs()
        .find((t) => t.view.browserId === browserId)
      if (tab) return { window, tab }
    }
    return null
  },

  getWindowWithBrowser(browser) {
    return this.getWindowWithBrowserId(browser.browserId)
  },

  focusWindow(id) {
    this.activeWindow = id
    this.events.emit('focus', this.getActiveWindow())
  },

  getActiveWindow() {
    return this.registeredWindows.get(this.activeWindow ?? -1)
  },
}
