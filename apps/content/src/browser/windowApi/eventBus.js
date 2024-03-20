/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check
import mitt from 'mitt'

/**
 * @type {import('@browser/event-bus').EventBus}
 */
export const eventBus = mitt()
eventBus.on('*', console.debug)

export function registerEventBus() {
  window.eventBus = eventBus
}
