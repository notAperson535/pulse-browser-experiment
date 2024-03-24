/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check
import { derived } from 'svelte/store'

import { browserImports } from '../browserImports.js'
import { viewableWritable } from '../utils/readableWritable.js'
import * as WebsiteViewApi from './WebsiteView.js'

/**
 * @typedef {object} WebsiteTab
 * @property {'website'} kind
 * @property {WebsiteView} view
 */

export const activeTabId = viewableWritable(0)

/**
 * @type {import('../utils/readableWritable.js').ViewableWritable<WebsiteTab[]>}
 */
export const windowTabs = viewableWritable([
  {
    kind: 'website',
    view: WebsiteViewApi.create(
      browserImports.NetUtil.newURI('https://google.com'),
    ),
  },
  {
    kind: 'website',
    view: WebsiteViewApi.create(
      browserImports.NetUtil.newURI('https://svelte.dev'),
    ),
  },
])

export const activeTab = derived(
  [activeTabId, windowTabs],
  ([$activeTabId, $windowTabs]) =>
    $windowTabs.find((tab) => tab.view.windowBrowserId === $activeTabId),
)

activeTabId.set(windowTabs.readOnce()[0].view.windowBrowserId)
