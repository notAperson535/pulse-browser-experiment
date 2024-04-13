/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
/// <reference types="@browser/link" />
/// <reference types="firefox-webext-browser" />
import { ExtensionTestUtils } from 'resource://app/modules/ExtensionTestUtils.sys.mjs'
import { TestManager } from 'resource://app/modules/TestManager.sys.mjs'

/**
 * @param {() => boolean} predicate
 * @returns {Promise<void>}
 */
async function spinLock(predicate) {
  while (!predicate()) {
    await new Promise((res) => setTimeout(res, 100))
  }
}

await TestManager.withBrowser(
  ['https://example.com/', 'https://google.com'],
  async (window) => {
    await spinLock(() =>
      window
        ?.windowTabs()
        .map(
          (tab) =>
            tab.view.browser?.mInitialized &&
            tab.view.websiteState === 'complete',
        )
        .reduce((p, c) => p && c, true),
    )

    await TestManager.test('tabs - Basic Query', async (test) => {
      const extension = ExtensionTestUtils.loadExtension(
        {
          manifest: {
            permissions: ['tabs'],
          },
          async background() {
            /** @type {import('resource://app/modules/ExtensionTestUtils.sys.mjs').TestBrowser} */
            const b = this.browser

            b.test.onMessage.addListener(async (msg) => {
              const windowId = Number(msg)
              const urlResults = await b.tabs.query({
                url: 'https://example.com/',
              })
              b.test.assertEq(
                1,
                urlResults.length,
                'There must only be one tab matching https://example.com',
              )
              b.test.assertEq(
                'https://example.com/',
                urlResults[0].url,
                'The url must match the original filter',
              )

              const windowResults = await b.tabs.query({
                windowId,
              })
              b.test.assertEq(
                2,
                windowResults.length,
                'Window should have 2 tabs',
              )
              b.test.assertEq(
                ['https://example.com/', 'https://www.google.com/'].join(','),
                [windowResults[0].url, windowResults[1].url].join(','),
                'Test tab urls',
              )
              b.test.assertEq(
                [true, false].join(','),
                [windowResults[0].active, windowResults[1].active].join(','),
                'Ensure that active tab is the first one',
              )
              b.test.assertEq(
                ['Example Domain', 'Google'].join(','),
                [windowResults[0].title, windowResults[1].title].join(','),
                'Titles should be roughly correct',
              )

              b.test.sendMessage('done')
            })
          },
        },
        test,
      )

      await extension
        .testCount(6)
        .startup()
        .then((e) => e.sendMsg(window.windowId.toString()))
        .then((e) => e.awaitMsg('done'))
        .then((e) => e.unload())
    })

    await TestManager.test('tabs - Remove', async (test) => {
      const extension = ExtensionTestUtils.loadExtension(
        {
          manifest: {
            permissions: ['tabs'],
          },
          async background() {
            /** @type {import('resource://app/modules/ExtensionTestUtils.sys.mjs').TestBrowser} */
            const b = this.browser

            b.test.onMessage.addListener(async (msg) => {
              const windowId = Number(msg)

              const windowResults = await b.tabs.query({
                windowId,
              })
              b.test.assertEq(
                ['https://example.com/', 'https://www.google.com/'].join(','),
                [windowResults[0].url, windowResults[1].url].join(','),
                'Window is correctly setup',
              )

              await b.tabs.remove(windowResults[1].id)

              const resultsAfterRemove = await b.tabs.query({
                windowId,
              })
              b.test.assertEq(1, resultsAfterRemove.length, 'Only one tab left')
              b.test.assertEq(
                ['https://example.com/'].join(','),
                resultsAfterRemove.map((r) => r.url).join(','),
                'Window is correctly setup',
              )

              b.test.sendMessage('done')
            })
          },
        },
        test,
      )

      await extension
        .testCount(3)
        .startup()
        .then((e) => e.sendMsg(window.windowId.toString()))
        .then((e) => e.awaitMsg('done'))
        .then((e) => e.unload())
    })
  },
)

await TestManager.withBrowser(
  ['https://example.com/', 'https://google.com'],
  async (window) => {
    await spinLock(() =>
      window
        ?.windowTabs()
        .map(
          (tab) =>
            tab.view.browser?.mInitialized &&
            tab.view.websiteState === 'complete',
        )
        .reduce((p, c) => p && c, true),
    )

    await TestManager.test('tabs - Update - Active', async (test) => {
      const extension = ExtensionTestUtils.loadExtension(
        {
          manifest: {
            permissions: ['tabs'],
          },
          async background() {
            /** @type {import('resource://app/modules/ExtensionTestUtils.sys.mjs').TestBrowser} */
            const b = this.browser

            b.test.onMessage.addListener(async (msg) => {
              const windowId = Number(msg)

              const windowResults = await b.tabs.query({
                windowId,
              })
              b.test.assertEq(
                ['https://example.com/', 'https://www.google.com/'].join(','),
                [windowResults[0].url, windowResults[1].url].join(','),
                'Window is correctly setup',
              )
              b.test.assertTrue(
                windowResults[0].active,
                'First tab should be active',
              )

              await b.tabs.update(windowResults[1].id || -1, { active: true })

              const resultsAfter = await b.tabs.query({
                windowId,
              })
              b.test.assertFalse(
                resultsAfter[0].active,
                'First tab should be inactive',
              )
              b.test.assertTrue(
                resultsAfter[1].active,
                'Second tab should be active',
              )
              b.test.sendMessage('done')
            })
          },
        },
        test,
      )

      await extension
        .testCount(4)
        .startup()
        .then((e) => e.sendMsg(window.windowId.toString()))
        .then((e) => e.awaitMsg('done'))
        .then((e) => e.unload())
    })

    await TestManager.test('tabs - Update - Url', async (test) => {
      const extension = ExtensionTestUtils.loadExtension(
        {
          manifest: {
            permissions: ['tabs'],
          },
          async background() {
            /** @type {import('resource://app/modules/ExtensionTestUtils.sys.mjs').TestBrowser} */
            const b = this.browser

            b.test.onMessage.addListener(async (msg) => {
              const windowId = Number(msg)

              let windowResults = await b.tabs.query({
                windowId,
              })

              try {
                await b.tabs.update(windowResults[0].id || -1, {
                  url: 'chrome://browser/content/gtests.html',
                })
                b.test.notifyFail('Failed to reject chrome:// url')
              } catch (e) {
                b.test.notifyPass('Failed to change url to chrome://')
              }

              try {
                await b.tabs.update(windowResults[0].id || -1, {
                  url: 'file://some/local/path.txt',
                })
                b.test.notifyFail('Failed to reject file:// url')
              } catch (e) {
                b.test.notifyPass('Failed to change url to file://')
              }

              try {
                await b.tabs.update(windowResults[0].id || -1, {
                  url: 'about:addons',
                })
                b.test.notifyFail('Failed to reject priviged about: url')
              } catch (e) {
                b.test.notifyPass('Failed to change url to priviged about:')
              }

              try {
                await b.tabs.update(windowResults[0].id || -1, {
                  url: 'javascript:console.log("Hello world!")',
                })
                b.test.notifyFail('Failed to reject javascript: url')
              } catch (e) {
                b.test.notifyPass('Failed to change url to javascript:')
              }

              try {
                await b.tabs.update(windowResults[0].id || -1, {
                  url: 'data:text/vnd-example+xyz;foo=bar;base64,R0lGODdh',
                })
                b.test.notifyFail('Failed to reject data: url')
              } catch (e) {
                b.test.notifyPass('Failed to change url to data:')
              }

              await b.tabs.update(windowResults[0].id || -1, {
                url: 'about:blank',
              })
              await new Promise((res) => setTimeout(res, 200))

              windowResults = await b.tabs.query({
                windowId,
              })

              b.test.assertEq(
                'about:blank',
                windowResults[0].url,
                'URL update works',
              )

              b.test.sendMessage('done')
            })
          },
        },
        test,
      )

      await extension
        .testCount(6)
        .startup()
        .then((e) => e.sendMsg(window.windowId.toString()))
        .then((e) => e.awaitMsg('done'))
        .then((e) => e.unload())
    })

    await TestManager.test('tabs - Get', async (test) => {
      const extension = ExtensionTestUtils.loadExtension(
        {
          manifest: {
            permissions: ['tabs'],
          },
          async background() {
            /** @type {import('resource://app/modules/ExtensionTestUtils.sys.mjs').TestBrowser} */
            const b = this.browser

            b.test.onMessage.addListener(async (msg) => {
              const windowId = Number(msg)

              let windowResults = await b.tabs.query({
                windowId,
              })
              const tab = await b.tabs.get(windowResults[0].id || -1)

              b.test.assertEq(
                JSON.stringify(windowResults[0]),
                JSON.stringify(tab),
                'Fetch result should be the same as the query result',
              )

              b.test.sendMessage('done')
            })
          },
        },
        test,
      )

      await extension
        .testCount(1)
        .startup()
        .then((e) => e.sendMsg(window.windowId.toString()))
        .then((e) => e.awaitMsg('done'))
        .then((e) => e.unload())
    })

    await TestManager.test('tabs - Navigation', async (test) => {
      const extension = ExtensionTestUtils.loadExtension(
        {
          manifest: {
            permissions: ['tabs'],
          },
          async background() {
            /** @type {import('resource://app/modules/ExtensionTestUtils.sys.mjs').TestBrowser} */
            const b = this.browser

            b.test.onMessage.addListener(async (msg) => {
              const windowId = Number(msg)

              let windowResults = await b.tabs.query({
                windowId,
              })

              // History stack already setup on the tab at index 0, so we can
              // use that here instead. Its probibly going to cause flaky tests
              // in the future, but it stops spawning a new window

              b.test.assertEq(
                'about:blank',
                windowResults[0].url,
                'Previous tests should leave as about:blank',
              )

              await b.tabs.goBack(windowResults[0].id)

              b.test.assertEq(
                'https://example.com/',
                await b.tabs.get(windowResults[0].id || -1).then((t) => t.url),
                'New url should be last page',
              )

              await b.tabs.goForward(windowResults[0].id)

              b.test.assertEq(
                'about:blank',
                await b.tabs.get(windowResults[0].id || -1).then((t) => t.url),
                'New url should be next page',
              )

              b.test.sendMessage('done')
            })
          },
        },
        test,
      )

      await extension
        .testCount(3)
        .startup()
        .then((e) => e.sendMsg(window.windowId.toString()))
        .then((e) => e.awaitMsg('done'))
        .then((e) => e.unload())
    })
  },
)
