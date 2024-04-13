/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
import BrowserWindow from './BrowserWindow.svelte'
import './browser.css'
import * as WindowTabs from './windowApi/WindowTabs.js'
import { registerEventBus } from './windowApi/eventBus.js'

// Handle window arguments
let rawArgs = window.arguments && window.arguments[0]
/** @type {Record<string, string>} */
let args = {}

if (rawArgs && rawArgs instanceof Ci.nsISupports) {
  args = rawArgs.wrappedJSObject || {}
} else if (rawArgs) {
  args = rawArgs
}

const initialUrls = args.initialUrl
  ? [args.initialUrl]
  : ['https://google.com/', 'https://svelte.dev/']

WindowTabs.initialize(initialUrls)

registerEventBus()

new BrowserWindow({ target: document.body })
