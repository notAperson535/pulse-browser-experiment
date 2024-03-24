/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check

/**
 * @template T
 * @typedef {import('svelte/store').StartStopNotifier<T>} StartStopNotifier
 */
/**
 * @template S
 * @typedef {import('svelte/store').Subscriber<S>} Subscriber
 */
/**
 * @typedef {import('svelte/store').Unsubscriber} Unsubscriber
 */
/**
 * @template R
 * @typedef {import('svelte/store').Updater<R>} Updater
 */
/**
 * @template U
 * @typedef {import('svelte/store').Writable<U>} Writable
 */

/**
 * @template T
 * @typedef {[Subscriber<T>, import('svelte/store').Invalidator<T>]} SubInvTuple
 */

/** @type {(SubInvTuple<any> | any)[]} */
const subscriber_queue = []
const noop = () => {}

/**
 * @template T
 * @param {T} a
 * @param {T} b
 * @returns {boolean}
 */
export function safe_not_equal(a, b) {
  return a != a
    ? b == b
    : a !== b || (a && typeof a === 'object') || typeof a === 'function'
}

/**
 * @template T
 * @typedef {Writable<T> & { readOnce: () => T }} ViewableWritable
 */

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * This variant allows for reading outside of a subscription
 *
 * https://svelte.dev/docs/svelte-store#writable
 *
 * @template T
 * @param {T} value
 * @param {StartStopNotifier<T>} [start=noop]
 * @returns {ViewableWritable<T>}
 *
 * @license MIT The following code was taken directly from svelte. For the license
 *              see svelteUtils.svelte.license.md
 */
export function viewableWritable(value, start = noop) {
  let stop = null
  const subscribers = new Set()

  /**
   * @param {T} new_value
   * @returns {void}
   */
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value
      if (stop) {
        // store is ready
        const run_queue = !subscriber_queue.length
        for (const subscriber of subscribers) {
          subscriber[1]()
          subscriber_queue.push(subscriber, value)
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1])
          }
          subscriber_queue.length = 0
        }
      }
    }
  }

  /**
   * @param {Updater<T>} fn
   * @returns {void}
   */
  function update(fn) {
    set(fn(value))
  }

  /**
   * @param {Subscriber<T>} run
   * @param {import('svelte/store').Invalidator<T>} [invalidate=noop]
   * @returns {Unsubscriber}
   */
  function subscribe(run, invalidate = noop) {
    const subscriber = [run, invalidate]
    subscribers.add(subscriber)
    if (subscribers.size === 1) {
      stop = start(set, update) || noop
    }
    run(value)
    return () => {
      subscribers.delete(subscriber)
      if (subscribers.size === 0 && stop) {
        stop()
        stop = null
      }
    }
  }

  return { set, update, subscribe, readOnce: () => value }
}
