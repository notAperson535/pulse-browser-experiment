/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check
/// <reference types="@browser/link" />

export class ThemeMetaParent extends JSWindowActorParent {
  receiveMessage(aMsg) {
    /** @type {Window} */
    const win = this.browsingContext.topChromeWindow

    if (aMsg.name === 'Theme:ColorsUpdated') {
      win.eventBus.emit('themeUpdate', {
        ...aMsg.data,
        browserId: this.browsingContext.embedderElement.browserId,
      })
    }
  }
}
