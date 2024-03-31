/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

declare type WebsiteViewLocationChangeProperties = {
  aWebProgress: nsIWebProgressType
  aRequest: nsIRequestType
  aLocation: nsIURIType
  aFlags: number
  id: number
}

declare type OklchThemeVariant = { lightness: number; chroma: number }

declare type OklchTheme = {
  hue: number
  foreground: OklchThemeVariant
  background: OklchThemeVariant
  active: OklchThemeVariant
}

declare type WebsiteViewEvents = {
  loadingChange: boolean
  progressPercent: number
  locationChange: WebsiteViewLocationChangeProperties
  themeChange: OklchTheme
}

declare type WebsiteView = {
  windowBrowserId: number
  theme?: OklchTheme

  browser: XULBrowserElement
  browserId?: number

  events: import('mitt').Emitter<WebsiteViewEvents>

  tabProgressListener: null | TabProgressListenerCleanup
}

declare interface TabProgressListenerCleanup {
  remove(browser: XULBrowserElement): void
}
