/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

declare module '@browser/event-bus' {
  import { Emitter } from 'mitt'

  export type ThemeUpdate = {
    browserId: number
    meta?: string
    body?: string
  }

  export type IconUpdate = {
    browserId: number
    iconUrl: string
  }

  export type EventBus = Emitter<{
    themeUpdate: ThemeUpdate
    iconUpdate: IconUpdate
  }>
}
