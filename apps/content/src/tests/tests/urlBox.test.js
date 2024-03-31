/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test } from 'zora'

import { getFastAutocomplete } from '../../browser/components/urlBox.js'

export async function urlBox() {
  test('Fast autocomplete', (test) => {
    test.test('URL: google.com', (test) => {
      const result = getFastAutocomplete('google.com')
      test.ok(result, 'result exists')
      test.ok(result.length > 0, 'result has length')
      test.equal(result[0]?.display, 'https://google.com', 'title is correct')
      test.equal(result[0]?.url, 'https://google.com', 'url is correct')
      test.equal(result[1]?.display, 'google.com', 'title is correct')
      test.equal(
        result[1]?.url,
        'https://duckduckgo.com/?q=google.com',
        'url is correct',
      )
    })

    test.test('URL: https://google.com', (test) => {
      const result = getFastAutocomplete('https://google.com')
      test.ok(result, 'result exists')
      test.ok(result.length > 0, 'result has length')
      test.equal(result[0]?.display, 'https://google.com', 'title is correct')
      test.equal(result[0]?.url, 'https://google.com', 'url is correct')
      test.equal(result[1]?.display, 'https://google.com', 'title is correct')
      test.equal(
        result[1]?.url,
        'https://duckduckgo.com/?q=https://google.com',
        'url is correct',
      )
    })

    test.test('URL: google.com/test', (test) => {
      const result = getFastAutocomplete('google.com/test')
      test.ok(result, 'result exists')
      test.ok(result.length > 0, 'result has length')
      test.equal(
        result[0]?.display,
        'https://google.com/test',
        'title is correct',
      )
      test.equal(result[0]?.url, 'https://google.com/test', 'url is correct')
      test.equal(result[1]?.display, 'google.com/test', 'title is correct')
      test.equal(
        result[1]?.url,
        'https://duckduckgo.com/?q=google.com/test',
        'url is correct',
      )
    })

    test.test('URLProvider: https://abc.notarealurl/test', (test) => {
      const result = getFastAutocomplete('https://abc.notarealurl/test')
      test.ok(result, 'result exists')
      test.equal(result.length, 1, 'result has length')
      test.equal(
        result[0]?.display,
        'https://abc.notarealurl/test',
        'title is correct',
      )
      test.equal(
        result[0]?.url,
        'https://duckduckgo.com/?q=https://abc.notarealurl/test',
        'url is correct',
      )
    })

    test.test('URLProvider: about:blank', (test) => {
      const result = getFastAutocomplete('about:blank')
      test.eq(result.length, 2, 'There should be 2 result')
      test.eq(result[0]?.display, 'about:blank', 'The title should be correct')
      test.eq(result[0]?.url, 'about:blank', 'The url should be correct')
      test.eq(result[1]?.display, 'about:blank', 'The title should be correct')
      test.eq(
        result[1]?.url,
        'https://duckduckgo.com/?q=about:blank',
        'The url should be correct',
      )
    })
  })
}
