/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
/// <reference types="@browser/link" />
import { browserImports } from '../browserImports.js'
import { createBrowser } from '../utils/browserElement.js'

const ABOUT_BLANK = browserImports.NetUtil.newURI('about:blank')
const EXTENSION_CONTENT_SCRIPT =
  'chrome://extensions/content/ext-browser-content.js'

/**
 * @template {XULPanel} Node
 * @template {{ url: string, launchTarget: HTMLElement, open: boolean }} Parameters
 * @template {{ 'on:close': (e: CustomEvent<null>) => void }} Attributes
 *
 * @param {Node} panel
 * @param {Parameters} param1
 *
 * @returns {import('svelte/action').ActionReturn<Parameters, Attributes>}
 */
export function actionPanel(panel, { url, launchTarget }) {
  let extensionUri = browserImports.NetUtil.newURI(url)
  let browser = createBrowser(ABOUT_BLANK, {
    disableglobalhistory: 'true',
    messagemanagergroup: 'webext-browsers',
    'webextension-view-type': 'popup',
  })
  let messageReceiver = new MessageReceiver(browser)
  panel.appendChild(browser)

  function setupBrowser() {
    browser.messageManager.addMessageListener(
      'Extension:BrowserResized',
      messageReceiver,
    )
    browser.messageManager.loadFrameScript(
      EXTENSION_CONTENT_SCRIPT,
      false,
      true,
    )
    browser.messageManager.sendAsyncMessage('Extension:InitBrowser', {
      allowScriptsToClose: true,
      maxWidth: 800,
      maxHeight: 600,
    })
  }

  function triggerOpen(/** @type {boolean} */ open) {
    if (!open) {
      panel.hidePopup()
      return
    }

    panel.openPopup(launchTarget, 'bottomright topright')
    browser.source = extensionUri.spec
    try {
      browser.loadURI(extensionUri, {
        triggeringPrincipal:
          Services.scriptSecurityManager.getSystemPrincipal(),
      })
    } catch (e) {
      console.debug('Debug info for changing url')
      console.debug(browser, extensionUri)
      console.error(e)
    }

    return () => {}
  }

  function handleClose() {
    panel.dispatchEvent(new CustomEvent('close', { detail: null }))
    browser.source = ABOUT_BLANK.spec
    try {
      browser.loadURI(ABOUT_BLANK, {})
    } catch (e) {
      console.debug('Debug info for changing url')
      console.debug(browser, extensionUri)
      console.error(e)
    }

    return () => {}
  }

  setupBrowser()
  browser.addEventListener('DidChangeBrowserRemoteness', setupBrowser)
  panel.addEventListener('popuphidden', handleClose)

  return {
    update({ url: newUrl, launchTarget: lt, open }) {
      if (newUrl != url) extensionUri = browserImports.NetUtil.newURI(newUrl)
      launchTarget = lt

      triggerOpen(open)
    },

    destroy() {
      browser.messageManager?.removeMessageListener(
        'Extension:BrowserResized',
        messageReceiver,
      )
      browser.removeEventListener('DidChangeBrowserRemoteness', setupBrowser)
      browser.remove()

      panel.removeEventListener('popuphidden', handleClose)
    },
  }
}

/**
 * @param {MouseEvent} event
 */
export function clickModifiersFromEvent(event) {
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
  /** @type {XULBrowserElement} */
  browser

  /** @param {XULBrowserElement} browser  */
  constructor(browser) {
    this.browser = browser
  }

  /**
   * @param {ReceiveMessageArgument} data
   */
  receiveMessage(data) {
    if (data.name === 'Extension:BrowserResized') {
      const { width, height } = data.data
      if (this.browser) {
        this.browser.style.width = `${width}px`
        this.browser.style.height = `${height}px`
      }

      return
    }
  }
}
