/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check
/// <reference types="@browser/link" />

/** @type {import('resource://app/modules/SvelteStore.sys.mjs').ReadableFn} */
export function readable(initial, update) {
  let value = initial

  let nextSubscription = 0
  let subscriptions = {}

  const init = !update
    ? () => {}
    : () =>
        update((v) => {
          value = v
          for (const id in subscriptions) {
            subscriptions[id](value)
          }
        })

  return {
    subscribe(cb) {
      if (nextSubscription === 0) init()

      const id = nextSubscription++
      subscriptions[id] = cb
      cb(value)
      return () => delete subscriptions[id]
    },
    get: () => value,
  }
}

/** @type {import('resource://app/modules/SvelteStore.sys.mjs').WritableFn} */
export function writable(initial) {
  let value = initial

  let nextSubscription = 0
  let subscriptions = {}

  /** @param {typeof value} v */
  function set(v) {
    value = v
    for (const id in subscriptions) {
      subscriptions[id](value)
    }
  }

  return {
    set,

    subscribe(cb) {
      const id = nextSubscription++
      subscriptions[id] = cb
      cb(value)
      return () => delete subscriptions[id]
    },
    update: (cb) => set(cb(value)),
    get: () => value,
  }
}

/** @type {import('resource://app/modules/SvelteStore.sys.mjs').MapFn} */
export function map(initial) {
  let value = initial

  let nextGlobalSubscription = 0
  let globalSubscriptions = {}

  function triggerGlobalUpdate() {
    for (const id in globalSubscriptions) {
      globalSubscriptions[id](value)
    }
  }

  return {
    get: () => ({ ...value }),
    /** @param {(value: typeof initial) => void} cb  */
    subscribe(cb) {
      const id = nextGlobalSubscription++
      globalSubscriptions[id] = cb
      cb(value)
      return () => delete globalSubscriptions[id]
    },

    /** @param {keyof typeof initial} k */
    key: (k) => value[k],
    /**
     * @param {keyof typeof initial} key
     * @param {typeof initial[keyof typeof initial]} v
     */
    addKey(key, v) {
      value[key] = v
      triggerGlobalUpdate()
      return v
    },
    /** @param {keyof typeof initial} key */
    removeKey(key) {
      const v = value[key]
      delete value[key]
      triggerGlobalUpdate()
      return v
    },
  }
}

/** @type {import('resource://app/modules/SvelteStore.sys.mjs').DerivedFn} */
export function derived(stores, update) {
  return readable(update(...stores.map((store) => store.get())), (set) => {
    const performUpdate = () =>
      set(update(...stores.map((store) => store.get())))
    for (const store of stores) {
      store.subscribe(performUpdate)
    }
  })
}
