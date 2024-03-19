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
