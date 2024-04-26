/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

declare module 'resource://app/modules/SvelteStore.sys.mjs' {
  export interface BasicStore<T> {
    /**
     * Svelte will assume that the store is undefined until update is called.
     * A sane implementaiton would call it once on subscribe
     *
     * @returns A method for unsubscribing from the store
     */
    subscribe(update: (value: T) => void): () => void
  }

  export interface BasicWritableStore<T> extends BasicStore<T> {
    set(value: T): void
  }

  export interface IReadable<T> extends BasicStore<T> {
    get(): T
  }

  export interface IWritable<T> extends IReadable<T>, BasicWritableStore<T> {
    update(call: (value: T) => T): void
  }

  /**
   * Get notified when keys are added or removed, but not changed. For changes,
   * you should make the values stores
   */
  export interface IMapStore<K extends string, V>
    extends IReadable<Record<K, V>> {
    addKey(key: K, value: V): V
    removeKey(key: K): V
    key(key: K): V | undefined
  }

  export type ReadableFn = <T>(
    value: T,
    update?: (set: (value: T) => void) => void,
  ) => IReadable<T>
  export const readable: ReadableFn

  export type WritableFn = <T>(value: T) => IWritable<T>
  export const writable: WritableFn

  export type MapFn = <K extends string, V>(
    value: Record<K, V>,
  ) => IMapStore<K, V>
  export const map: MapFn

  export type StoreValues<T> = T extends IReadable<infer U>
    ? U
    : { [K in keyof T]: T[K] extends IReadable<infer U> ? U : never }

  export type DerivedFn = <Stores extends Array<IReadable<any>>, V>(
    stores: Stores,
    update: (...values: StoreValues<Stores>) => V,
  ) => IReadable<V>
  export const derived: DerivedFn
}
