/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
import { derived } from 'svelte/store'

import tld from '../data/tld.txt'

/**
 * @typedef {object} AutocompleteResult
 * @property {string} display
 * @property {string} url
 */

/**
 * @typedef {'insecure' | 'broken' | 'secure' | 'blocked-mixed-active' | 'loaded-mixed-active' | 'blocked-mixed-display' | 'loaded-mixed-display' | 'ssl-3' | 'week-cert' | 'user-overridden'} SecurityState
 */

/**
 * @param {import('svelte/store').Readable<number>} store
 */
export function humanSecurityInfo(store) {
  return derived(store, (store) => {
    /** @type {Set<SecurityState>} */
    const status = new Set()

    if (store & Ci.nsIWebProgressListener.STATE_IS_INSECURE) {
      status.add('insecure')
    }
    if (store & Ci.nsIWebProgressListener.STATE_IS_BROKEN) {
      status.add('broken')
    }
    if (store & Ci.nsIWebProgressListener.STATE_IS_SECURE) {
      status.add('secure')
    }
    if (store & Ci.nsIWebProgressListener.STATE_BLOCKED_MIXED_ACTIVE_CONTENT) {
      status.add('blocked-mixed-active')
    }
    if (store & Ci.nsIWebProgressListener.STATE_LOADED_MIXED_ACTIVE_CONTENT) {
      status.add('loaded-mixed-active')
    }
    if (store & Ci.nsIWebProgressListener.STATE_BLOCKED_MIXED_DISPLAY_CONTENT) {
      status.add('blocked-mixed-display')
    }
    if (store & Ci.nsIWebProgressListener.STATE_LOADED_MIXED_DISPLAY_CONTENT) {
      status.add('loaded-mixed-display')
    }
    if (store & Ci.nsIWebProgressListener.STATE_USES_SSL_3) {
      status.add('ssl-3')
    }
    if (store & Ci.nsIWebProgressListener.STATE_USES_WEAK_CRYPTO) {
      status.add('week-cert')
    }
    if (store & Ci.nsIWebProgressListener.STATE_CERT_USER_OVERRIDDEN) {
      status.add('user-overridden')
    }

    return status
  })
}

/**
 * Autocomplete that should take under a milisecond to evaluate. There will be
 * no debouncing on the user's input
 *
 * @param {string} input
 */
export function getFastAutocomplete(input) {
  if (input == '') return []

  return [...getUrlResults(input), ...getFastSearchResults(input)]
}

/**
 * @param {import('svelte/store').Readable<string>} input
 * @returns {import('svelte/store').Readable<AutocompleteResult[]>}
 */
export function debouncedSlowAutocomplete(input) {
  let timeout
  return derived(
    input,
    (input, set) => {
      if (input == '') {
        return set([])
      }

      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(async () => {
        let /** @type {AutocompleteResult[]} */ output = []

        slowAutocomplete(input).map((completions) =>
          completions.then((completions) => {
            output.push(...completions)
            set(output)
          }),
        )
      }, 100)
    },
    [],
  )
}

/**
 * @param {string} input
 * @returns {Promise<AutocompleteResult[]>[]}
 */
function slowAutocomplete(input) {
  return [duckduckgoAutocomplete(input)]
}

/**
 * Uses `nsIEditor` to reduce the emphisis of schema and path
 * bits and bobs. Heavily based on mozilla's code. I did not
 * come up with these shenanagans
 *
 * @param {HTMLInputElement?} inputElement
 */
export function performCursedUrlStyling(inputElement) {
  /**
   * Manual currying!
   */
  return () => {
    try {
      if (!inputElement) return

      // @ts-expect-error - shenanagans !== type checking :(
      const /** @type {nsIEditorType} */ editor = inputElement.editor
      const /** @type {nsISelectionControllerType} */ controller =
          editor?.selectionController

      if (!editor || !controller) {
        console.debug('Editor and selection controller not available :(')
        return
      }

      const textNode = editor.rootElement.firstChild
      let startIndex = 0,
        currentIndex = 0

      const strikeOut = controller.getSelection(
        controller.SELECTION_URLSTRIKEOUT,
      )
      const secondary = controller.getSelection(
        controller.SELECTION_URLSECONDARY,
      )

      if (!textNode) {
        return
      }

      // Consume the url scheme. No, that doesn't consume the third strike
      // of resource:///, because the third strike has semantic meaning!
      if (!inputElement.value.includes('://')) {
        return
      }
      {
        const isHttp = inputElement.value.startsWith('http://')

        while (inputElement.value[currentIndex] != ':') {
          currentIndex += 1
        }

        currentIndex += 3

        const range = document.createRange()
        range.setStart(textNode, startIndex)
        range.setEnd(textNode, currentIndex)
        secondary.addRange(range)

        if (isHttp) {
          const range = document.createRange()
          range.setStart(textNode, startIndex)
          range.setEnd(textNode, currentIndex - 3)
          strikeOut.addRange(range)
        }

        startIndex = currentIndex
      }

      if (!inputElement.value.includes('://www.')) {
        return
      }
      {
        currentIndex += 4

        const range = document.createRange()
        range.setStart(textNode, startIndex)
        range.setEnd(textNode, currentIndex)

        secondary.addRange(range)
        startIndex = currentIndex
      }

      // Consume path
      if (!inputElement.value.substring(startIndex).includes('/')) {
        return
      }
      {
        while (inputElement.value[startIndex] != '/') {
          startIndex += 1
        }

        const range = document.createRange()
        range.setStart(textNode, startIndex)
        range.setEnd(textNode, inputElement.value.length)
        secondary.addRange(range)
      }
    } catch (e) {
      console.debug('Error performing url styling', e)
    }
  }
}

/**
 * @param {string} input
 * @returns {Promise<AutocompleteResult[]>}
 */
async function duckduckgoAutocomplete(input) {
  const response = await fetch(
    `https://ac.duckduckgo.com/ac/?q=${input}&type=list&callback=jsonCallback`,
  )
  const /** @type {[string, string[]]} */ json = await response.json()
  const completions = json[1]

  if (!completions) {
    console.warn('DuckDuckGo completions did not return correctly', json)
    return []
  }

  return completions
    .filter((comp) => comp != input)
    .map((comp) => ({
      display: comp,
      url: `https://duckduckgo.com/?q=${comp}`,
    }))
}

const HTTPS_REGEX =
  /^(?<protocol>https?:\/\/)?(?<domain>(\w+\.)+(?<tld>\w+))(?<path>\/.*)?$/m
const EXTENSION_REGEX = /^moz-extension:\/\/.+$/m
const CHROME_REGEX = /^chrome:\/\/.+$/m
const ABOUT_REGEX = /^about:.+$/m
const tlds = tld
  .split('\n')
  .filter((/** @type {string} */ tld) => tld.length > 0 && !tld.startsWith('#'))

/**
 * @param {string} input
 * @returns {AutocompleteResult[]}
 */
function getUrlResults(input) {
  // If it is an exact match against an internal url
  if (
    EXTENSION_REGEX.test(input) ||
    CHROME_REGEX.test(input) ||
    ABOUT_REGEX.test(input)
  ) {
    return [{ display: input, url: input }]
  }

  const match = HTTPS_REGEX.exec(input)
  if (match === null) return []

  const { protocol, domain, tld, path } = match.groups || {}
  const uri = `${protocol || 'https://'}${domain}${path || ''}`

  // If it is not a valid tld, don't show it
  if (!tlds.includes(tld.toUpperCase())) return []

  return [{ display: uri, url: uri }]
}

/**
 * @param {string} input
 * @returns {AutocompleteResult[]}
 */
function getFastSearchResults(input) {
  return [{ display: input, url: `https://duckduckgo.com/?q=${input}` }]
}
