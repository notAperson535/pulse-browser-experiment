/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { writable } from 'svelte/store'

import type { ContextMenuInfo } from '../../../actors/ContextMenu.types'

import { Tab } from '../components/tabs/tab'
import { resource } from './resources'

export const browserContextMenuInfo = writable<ContextMenuInfo>({
  position: { screenX: 0, screenY: 0, inputSource: 0 },
})

let internalSelectedTab = -1
export const selectedTab = writable(-1)
selectedTab.subscribe((v) => (internalSelectedTab = v))

export const tabs = writable([
  new Tab(resource.NetUtil.newURI('https://google.com')),
  new Tab(resource.NetUtil.newURI('https://google.com')),
])

export function openTab(url = 'https://google.com') {
  tabs.update((tabs) => {
    const newTab = new Tab(resource.NetUtil.newURI(url))
    selectedTab.set(newTab.getId())
    return [...tabs, newTab]
  })
}

export function closeTab(tab: Tab) {
  tabs.update((tabs) => {
    const tabIndex = tabs.findIndex((t) => t.getId() == t.getId())
    const filtered = tabs.filter((t) => t.getId() != tab.getId())

    if (filtered.length == 0) {
      window.close()
      return []
    }

    if (filtered[tabIndex]) {
      selectedTab.set(filtered[tabIndex].getId())
    } else {
      selectedTab.set(filtered[tabIndex - 1].getId())
    }

    tab.destroy()
    return filtered
  })
}

function getCurrent(): Tab | undefined {
  let tab

  tabs.update((tabs) => {
    tab = tabs.find((t) => t.getId() == internalSelectedTab)
    return tabs
  })

  return tab
}

export function runOnCurrentTab<R>(method: (tab: Tab) => R): R | void {
  const currentTab = getCurrent()
  if (currentTab) return method(currentTab)
}

export function getCurrentTabIndex(): number {
  let tabIndex = 0

  tabs.update((tabs) => {
    tabIndex = tabs.findIndex((tab) => tab.getId() == internalSelectedTab)
    return tabs
  })

  return tabIndex
}

export function setCurrentTabIndex(index: number) {
  tabs.update((tabs) => {
    // Wrap the index
    if (index < 0) index = tabs.length - 1
    if (index >= tabs.length) index = 0

    selectedTab.set(tabs[index].getId())

    return tabs
  })
}

export function moveTabBefore(toMoveId: number, targetId: number) {
  tabs.update((tabs) => {
    const toMoveIndex = tabs.findIndex((tab) => tab.getId() == toMoveId)
    const targetIndex = Math.max(
      tabs.findIndex((tab) => tab.getId() == targetId) - 1,
      0,
    )

    // If we do in-place modifications with tabs, svelte won't notice the
    // change
    const newTabs = [...tabs]
    insertAndShift(newTabs, toMoveIndex, targetIndex)
    return newTabs
  })
}

export function moveTabAfter(toMoveId: number, targetId: number) {
  tabs.update((tabs) => {
    const toMoveIndex = tabs.findIndex((tab) => tab.getId() == toMoveId)
    const targetIndex = tabs.findIndex((tab) => tab.getId() == targetId)

    // If we do in-place modifications with tabs, svelte won't notice the
    // change
    const newTabs = [...tabs]
    insertAndShift(newTabs, toMoveIndex, targetIndex)
    return newTabs
  })
}

function insertAndShift<T>(arr: T[], from: number, to: number) {
  const cutOut = arr.splice(from, 1)[0]
  arr.splice(to, 0, cutOut)
}

export const windowApi = {
  closeTab,
  openTab,
  setIcon: (browser: any, iconURL: string) =>
    tabs.update((tabs) => {
      tabs.find((tab) => tab.getTabId() == browser.browserId)?.icon.set(iconURL)
      return tabs
    }),
  showContextMenu: (menuInfo: ContextMenuInfo) => {
    browserContextMenuInfo.set(menuInfo)

    const event = document.createEvent('MouseEvent') as any
    event.initNSMouseEvent(
      'contextmenu',
      true,
      true,
      null,
      0,
      menuInfo.position.screenX,
      menuInfo.position.screenY,
      0,
      0,
      false,
      false,
      false,
      false,
      2,
      null,
      0,
      menuInfo.position.inputSource,
    )

    const contextMenu = document.getElementById('browser_context_menu') as any
    contextMenu.openPopupAtScreen(
      menuInfo.position.screenX,
      menuInfo.position.screenY,
      true,
      event,
    )
  },
}

window.windowApi = windowApi