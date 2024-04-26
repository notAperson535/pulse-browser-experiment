/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
/// <reference types="@browser/link" />
import { map, writable } from 'resource://app/modules/SvelteStore.sys.mjs'
import mitt from 'resource://app/modules/mitt.sys.mjs'

import { derived } from './SvelteStore.sys.mjs'

/** @typedef {import('resource://app/modules/EBrowserActions.sys.mjs').IBrowserAction} IBrowserAction */
/** @implements {IBrowserAction} */
class BrowserAction {
  id
  /** @type {ReturnType<IBrowserAction['getEmiter']>} */
  emiter = mitt()

  /** @type{import('resource://app/modules/SvelteStore.sys.mjs').IWritable<Record<number, string>>} */
  icons = writable({})
  /** @type {import('resource://app/modules/SvelteStore.sys.mjs').IWritable<string>} */
  title = writable('')
  /** @type {import('resource://app/modules/SvelteStore.sys.mjs').IWritable<string | undefined>} */
  popupUrl = writable(undefined)

  /**
   * @param {string} id
   */
  constructor(id) {
    this.id = id
  }

  getEmiter() {
    return this.emiter
  }

  getExtensionId() {
    return this.id
  }

  /**
   * @param {Record<number, string>} icons
   */
  setIcons(icons) {
    this.icons.set(icons)
  }
  getIcons() {
    return this.icons
  }
  /** @param {number} preferredSize */
  getIcon(preferredSize) {
    return derived([this.icons], (icon) => {
      let bestSize

      if (icon[preferredSize]) {
        bestSize = preferredSize
      } else if (icon[preferredSize * 2]) {
        bestSize = preferredSize * 2
      } else {
        const sizes = Object.keys(icon)
          .map((key) => parseInt(key, 10))
          .sort((a, b) => a - b)
        bestSize =
          sizes.find((candidate) => candidate > preferredSize) ||
          sizes.pop() ||
          0
      }

      return icon[bestSize]
    })
  }

  setTitle(title) {
    this.title.set(title)
  }
  getTitle() {
    return this.title
  }

  setPopupUrl(url) {
    this.popupUrl.set(url)
  }
  getPopupUrl() {
    return this.popupUrl
  }
}

/** @type {typeof import('resource://app/modules/EBrowserActions.sys.mjs').EBrowserActions} */
export const EBrowserActions = {
  BrowserAction: (id, options) => {
    const action = new BrowserAction(id)

    action.setIcons(options.icons)
    action.setTitle(options.title)
    action.setPopupUrl(options.popupUrl)

    return action
  },
  actions: map({}),
}
