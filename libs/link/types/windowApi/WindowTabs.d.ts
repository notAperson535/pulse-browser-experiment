/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/// <reference path="./WebsiteView.d.ts" />

declare module '@browser/tabs' {
  export type WindowTab = { kind: 'website'; view: WebsiteView }
  export type WindowTabs = WindowTab[]
}
