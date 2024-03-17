/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

type WindowTriggers = {
  bookmarkCurrentPage: undefined
}

declare interface WindowConfiguration {
  /**
   * The initial page to show when the window is opened
   */
  initialUrl: string
}

declare type ViewableWritable<T> = {
  readOnce(): T
} & import('svelte/store').Writable<T>

declare interface ITab {
  tabId: number | undefined

  title: ViewableWritable<string>
  icon: ViewableWritable<string | null>
  uri: ViewableWritable<nsIURIType>

  hidden: ViewableWritable<boolean>

  getTabId(): number
  getWindowId(): number
  getBrowserElement(): XULBrowserElement

  useEventListeners(): void
  removeEventListeners(): void

  goBack(): void
  goForward(): void
  reload(): void

  swapWithTab(tab: ITab): Promise<void>
}

declare type WindowApi = {
  /**
   * Identify which window this is. This should be used for actions like tab
   * moving that go across windows
   *
   * Note: You need to wait for the window watcher to register this window
   * before you get a valid id
   */
  id: number
  /**
   * Sets the window ID. You should only use this if you are the WindowWatcher
   */
  setId: (id: number) => void

  windowTriggers: import('mitt').Emitter<WindowTriggers>

  window: {
    new: (args?: WindowArguments) => unknown
  }

  tabs: {
    closeTab(tab: ITab): void
    openTab(url?: nsIURIType): ITab
    runOnCurrentTab<R>(callback: (tab: ITab) => R): R | undefined
    setCurrentTab(tab: ITab): void
    getCurrentTab(): ITab | undefined
    getTabById(id: number): ITab | undefined
    tabs: ITab[]
    setIcon(browser: XULBrowserElement, iconURL: string): void
  }

  contextMenu: {
    showContextMenu(menuInfo: ContextMenuInfo, actor: JSWindowActorParent): void
  }
}

declare interface Window {
  windowApi: WindowApi
}
