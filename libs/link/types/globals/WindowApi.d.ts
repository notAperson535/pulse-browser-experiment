/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

declare interface Window {
  windowId: number
  eventBus: import('@browser/event-bus').EventBus
  windowTabs: import('@amadeus-it-group/tansu').WritableSignal<
    import('@browser/tabs').WindowTabs
  >
  activeTab: import('@amadeus-it-group/tansu').ReadableSignal<
    import('@browser/tabs').WindowTab | undefined
  >
  activeTabId: import('@amadeus-it-group/tansu').WritableSignal<number>
  selectedTabIds: import('@amadeus-it-group/tansu').WritableSignal<number[]>
}
