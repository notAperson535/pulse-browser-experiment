/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check
import { readable } from 'svelte/store'

import { browserImports } from '../browserImports.js'
import { createBrowser } from '../utils/browserElement.js'
import { viewableWritable } from '../utils/readableWritable.js'

/**
 * @typedef {object} PageActionUiInternals
 * @property {import('resource://app/modules/EPageActions.sys.mjs').PageActionImpl} pageAction
 * @property {XULBrowserElement | null} browser
 * @property {MessageReceiver} [messageReceiver]
 * @property {import('../utils/readableWritable.js').ViewableWritable<any | undefined>} panel
 * @property {import('../utils/readableWritable.js').ViewableWritable<HTMLButtonElement | undefined>} trigger
 */

/**
 * @param {import('resource://app/modules/EPageActions.sys.mjs').PageActionImpl} pageAction
 * @returns {PageActionUiInternals}
 */
export function setup(pageAction) {
  const view = {
    pageAction,
    browser: null,

    panel: viewableWritable(undefined),
    trigger: viewableWritable(undefined),
  }

  view.messageReceiver = new MessageReceiver(view)

  return view
}

/**
 * @param {PageActionUiInternals} view
 */
export function getIcons(view) {
  return readable(
    view.pageAction.icons,
    /** @type {import('svelte/store').StartStopNotifier<Record<number, string> | undefined>} */ (
      set,
    ) => {
      view.pageAction.events.on('updateIcon', set)
      return () => view.pageAction.events.off('updateIcon', set)
    },
  )
}

/**
 * @param {PageActionUiInternals} view
 */
export function handleClick(view) {
  /**
   * @param {MouseEvent} event
   */
  return async (event) => {
    // Send the event to the extension
    view.pageAction.events.emit('click', {
      clickData: {
        modifiers: clickModifiersFromEvent(event),
        button: event.button,
      },
    })

    await buildPanelBrowser(view)
    // Panel may not exist if there is no popupUrl
    if (view.panel.readOnce())
      view.panel
        .readOnce()
        ?.openPopup(view.trigger.readOnce(), 'bottomright topright')
  }
}

/**
 * @param {PageActionUiInternals} view
 */
export function cleanup(view) {
  if (view.browser && view.messageReceiver) {
    view.browser.messageManager.removeMessageListener(
      'Extension:BrowserResized',
      view.messageReceiver,
    )
    view.browser.remove()
  }
}

/**
 * @param {PageActionUiInternals} view
 */
function setupBrowser(view) {
  const { browser, messageReceiver } = view
  if (!browser) {
    console.error(
      'Tried setting up browser for pageAction view without a browser',
      view,
    )
    return
  }

  if (!messageReceiver) {
    console.error(
      "For some reason pageAction view's messageReceiver was not initialzied??????",
      view,
    )
    return
  }

  browser.messageManager.addMessageListener(
    'Extension:BrowserResized',
    messageReceiver,
  )

  browser.messageManager.loadFrameScript(
    'chrome://extensions/content/ext-browser-content.js',
    false,
    true,
  )

  browser.messageManager.sendAsyncMessage('Extension:InitBrowser', {
    allowScriptsToClose: true,
    maxWidth: 800,
    maxHeight: 600,
  })
}

const spinLock = (/** @type {() => any} */ predicate) => {
  if (predicate()) return

  return new Promise((res) => {
    const interval = setInterval(() => {
      if (predicate()) {
        clearInterval(interval)
        res(null)
      }
    }, 1)
  })
}

/**
 * @param {PageActionUiInternals} view
 */
function initialized(view) {
  view.browser?.docShell
  return spinLock(() => view.browser?.mInitialized)
}

/**
 * @param {PageActionUiInternals} view
 */
async function buildPanelBrowser(view) {
  if (view.browser) {
    view.browser.remove()
  }

  if (!view.pageAction.popupUrl) return
  const uri = browserImports.NetUtil.newURI(view.pageAction.popupUrl)

  const browser = createBrowser(uri, {
    disableglobalhistory: 'true',
    messagemanagergroup: 'webext-browsers',
    'webextension-view-type': 'popup',
  })

  await spinLock(() => view.panel.readOnce())
  view.panel.readOnce()?.appendChild(browser)
  view.browser = browser
  if (!view.browser) {
    return
  }

  view.browser.style.borderRadius = 'inherit'
  setupBrowser(view)
  view.browser.addEventListener('DidChangeBrowserRemoteness', () =>
    setupBrowser(view),
  )

  await spinLock(() => browser.mInitialized)
  await initialized(view)

  view.browser.source = uri.spec
  try {
    view.browser.loadURI(uri, {
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    })
  } catch (e) {
    console.debug('Debug info for changing url')
    console.debug(view, uri)
    console.error(e)
  }
}

/**
 * @param {MouseEvent} event
 */
function clickModifiersFromEvent(event) {
  const map = {
    shiftKey: 'Shift',
    altKey: 'Alt',
    metaKey: 'Command',
    ctrlKey: 'Ctrl',
  }

  const modifiers = Object.keys(map)
    .filter((key) => event[key])
    .map((key) => map[key])

  if (event.ctrlKey && browserImports.AppConstants.platform === 'macosx') {
    modifiers.push('MacCtrl')
  }

  return modifiers
}

/**
 * @implements {MessageListener}
 */
class MessageReceiver {
  /**
   * @param {PageActionUiInternals} view
   */
  constructor(view) {
    this.view = view
  }

  /**
   * @param {ReceiveMessageArgument} data
   */
  receiveMessage(data) {
    if (data.name === 'Extension:BrowserResized') {
      const { width, height } = data.data
      if (this.view.browser) {
        this.view.browser.style.width = `${width}px`
        this.view.browser.style.height = `${height}px`
      }

      return
    }
  }
}
