/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
import BrowserWindow from './BrowserWindow.svelte'
import './browser.css'
import { registerEventBus } from './windowApi/eventBus.js'

registerEventBus()

new BrowserWindow({ target: document.body })