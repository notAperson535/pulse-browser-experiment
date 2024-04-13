/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
import { derived, writable } from '@amadeus-it-group/tansu'

import { browserImports } from '../browserImports.js'
import * as WebsiteViewApi from './WebsiteView.js'

export const activeTabId = writable(0)

/**
 * This is an an array of "selected" tabs. The tab that is in {@link activeTabId} should never be in this variable. There is an subscriber responsible for handling that
 *
 * @type {import('@amadeus-it-group/tansu').WritableSignal<number[]>}
 */
export const selectedTabIds = writable([])

window.activeTabId = activeTabId
window.selectedTabIds = selectedTabIds

/**
 * @param {number[]} ids
 */
export function addSelectedTabs(ids) {
  selectedTabIds.update((selected) => {
    for (const id of ids) {
      if (!selected.includes(id)) {
        selected = [...selected, id]
      }
    }

    return selected
  })
}

selectedTabIds.subscribe((ids) => {
  const activeId = activeTabId()
  if (ids.includes(activeId)) {
    selectedTabIds.set(ids.filter((id) => id != activeId))
  }
})

activeTabId.subscribe((activeId) => {
  const ids = selectedTabIds()
  if (ids.includes(activeId)) {
    selectedTabIds.set(ids.filter((id) => id != activeId))
  }
})

/**
 * @type {import('@amadeus-it-group/tansu').WritableSignal<import('@browser/tabs').WindowTabs>}
 */
export const windowTabs = writable([])

export const activeTab = derived(
  [activeTabId, windowTabs],
  ([$activeTabId, $windowTabs]) =>
    $windowTabs.find((tab) => tab.view.windowBrowserId === $activeTabId),
)

window.windowTabs = windowTabs
window.activeTab = activeTab

/**
 * @param {string[]} urls
 */
export function initialize(urls) {
  windowTabs.set(
    urls.map((url) => ({
      kind: 'website',
      view: WebsiteViewApi.create(browserImports.NetUtil.newURI(url)),
    })),
  )
  activeTabId.set(windowTabs()[0].view.windowBrowserId)
}
