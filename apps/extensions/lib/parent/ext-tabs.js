// @ts-check
/// <reference path="../types/index.d.ts" />
/// <reference path="./ext-browser.js" />

const { serialize } = require('v8')

/**
 * @typedef {'capture' | 'extension' | 'user'} MuteInfoReason
 *
 * @typedef {'loading' | 'complete'} TabStatus
 *
 * @typedef {object} MutedInfo
 * @property {string} [extensionId]
 * @property {boolean} muted
 * @property {MuteInfoReason} reason
 *
 * @typedef {object} SharingState
 * @property {'screen' | 'window' | 'application'} [screen]
 * @property {boolean} camera
 * @property {boolean} microphone
 *
 * @typedef {object} ExtTab
 * @property {boolean} active
 * @property {boolean} [attention]
 * @property {boolean} [audible]
 * @property {boolean} [autoDiscardable]
 * @property {string} [cookieStoreId]
 * @property {boolean} [discarded]
 * @property {string} [favIconUrl]
 * @property {number} [height]
 * @property {boolean} hidden
 * @property {boolean} highlighted
 * @property {number} [id]
 * @property {boolean} incognito
 * @property {number} index
 * @property {boolean} isArticle
 * @property {number} [lastAccessed]
 * @property {MutedInfo} [mutedInfo]
 * @property {number} [openerTabId]
 * @property {boolean} pinned
 * @property {string} sessionId
 * @property {TabStatus} [status]
 * @property {number} [successorTabId]
 * @property {string} [title]
 * @property {string} [url]
 * @property {number} [width]
 * @property {number} windowId
 *
 * @typedef {object} queryInfo
 * @property {boolean} [active]
 * @property {boolean} [attention]
 * @property {boolean} [pinned]
 * @property {boolean} [audible]
 * @property {boolean} [autoDiscardable]
 * @property {boolean} [muted]
 * @property {boolean} [highlighted]
 * @property {boolean} [currentWindow]
 * @property {boolean} [lastFocusedWindow]
 * @property {TabStatus} [status]
 * @property {boolean} [discarded]
 * @property {boolean} [hidden]
 * @property {string} [title]
 * @property {string | string[]} [url]
 * @property {number} [windowId]
 * @property {WindowType} [windowType]
 * @property {number} [index]
 * @property {string | string[]} [cookieStoreId]
 */

/**
 * @param {queryInfo} queryInfo
 */
function query(queryInfo) {
  const windows = [...lazy.WindowTracker.registeredWindows.entries()]

  const urlMatchSet =
    (queryInfo.url &&
      (Array.isArray(queryInfo.url)
        ? new MatchPatternSet(queryInfo.url)
        : new MatchPatternSet([queryInfo.url]))) ||
    null

  return windows.flatMap(([id, window]) =>
    window.windowApi.tabs.tabs.filter((tab) => {
      const uri =
        urlMatchSet === null ? true : urlMatchSet.matches(tab.uri.readOnce())
      const windowId = queryInfo.windowId ? id === queryInfo.windowId : true

      return uri && windowId
    }),
  )
}

/**
 * @param {ITab} tab
 * @returns {ExtTab}
 */
const serizlise = (tab) => ({
  active: true,
  hidden: tab.hidden.readOnce(),
  highlighted: false,
  incognito: false,
  index: -1, // TODO:
  isArticle: false,
  pinned: false,
  sessionId: '',
  windowId: tab.getWindowId(),
})

this.tabs = class extends ExtensionAPIPersistent {
  /**
   * @param {BaseContext} context
   */
  getAPI(context) {
    return {
      tabs: {
        /**
         * @param {queryInfo} queryInfo
         */
        async query(queryInfo) {
          console.log(queryInfo)
          return query(queryInfo).map(serialize)
        },
      },
    }
  }
}
