/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

declare module 'resource://app/modules/EBrowserActions.sys.mjs' {
  import type { Emitter } from 'mitt'
  import type {
    IMapStore,
    IReadable,
  } from 'resource://app/modules/SvelteStore.sys.mjs'

  export type IBrowserActionEvents = {
    click: {
      tabId: number
      clickData: { modifiers: string[]; button: number }
    }
  }

  export interface IBrowserAction {
    getEmiter(): Emitter<IBrowserActionEvents>

    getExtensionId(): string

    setIcons(icons: Record<number, string>): void
    getIcons(): IReadable<Record<number, string>>
    getIcon(resolution: number): IReadable<string>

    setTitle(title: string | undefined): void
    getTitle(): IReadable<string | undefined>

    setPopupUrl(url: string): void
    getPopupUrl(): IReadable<string | undefined>
  }

  export const EBrowserActions: {
    BrowserAction: (
      id: string,
      options: {
        title: string
        icons: Record<number, string>
        popupUrl?: string
      },
    ) => IBrowserAction
    actions: IMapStore<string, IBrowserAction>
  }
}

declare interface MozESMExportFile {
  EBrowserActions: 'resource://app/modules/EBrowserActions.sys.mjs'
}

declare interface MozESMExportType {
  EBrowserActions: typeof import('resource://app/modules/EBrowserActions.sys.mjs').EBrowserActions
}
