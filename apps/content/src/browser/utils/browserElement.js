/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
import { browserImports } from '../browserImports.js'

const { useRemoteTabs, useRemoteSubframe } = window.docShell.QueryInterface(
  Ci.nsILoadContext,
)

const DEFAULT_BROWSER_ATTRIBUTES = {
  message: 'true',
  messagemanagergroup: 'browsers',
  type: 'content',
  contextmenu: 'browser_context_menu',
}

/**
 * @param {nsIURIType} uri
 * @param {Record<string, string>} [attributes={}]
 *
 * @returns {XULBrowserElement}
 */
export function createBrowser(uri, attributes = {}) {
  let originAttributes = browserImports.E10SUtils.predictOriginAttributes({
    window,
  })
  const remoteType = browserImports.E10SUtils.getRemoteTypeForURI(
    uri.spec,
    useRemoteTabs,
    useRemoteSubframe,
    browserImports.E10SUtils.DEFAULT_REMOTE_TYPE,
    uri,
    originAttributes,
  )

  const browser = document.createXULElement('browser')
  if (remoteType) {
    browser.setAttribute('remoteType', remoteType)
    browser.setAttribute('remote', true)
  }

  for (const attribute in DEFAULT_BROWSER_ATTRIBUTES) {
    browser.setAttribute(attribute, DEFAULT_BROWSER_ATTRIBUTES[attribute])
  }

  for (const attribute in attributes) {
    browser.setAttribute(attribute, attributes[attribute])
  }

  if (useRemoteTabs) {
    browser.setAttribute('maychangeremoteness', 'true')
  }

  return browser
}
