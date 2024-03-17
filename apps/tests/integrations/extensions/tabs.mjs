/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
/// <reference types="@browser/link" />
import { ExtensionTestUtils } from 'resource://app/modules/ExtensionTestUtils.sys.mjs'
import { TestManager } from 'resource://app/modules/TestManager.sys.mjs'

await TestManager.withBrowser('http://example.com', async (window) => {
  await TestManager.test('tabs', async (test) => {
    const extension = ExtensionTestUtils.loadExtension(
      {
        manifest: { permissions: ['tabs'] },
        async background() {
          const { browser } = this

          const exampleTabs = await browser.tabs.query({
            url: 'http://example.com/',
          })
          browser.test.assertEq(
            exampleTabs.length,
            1,
            'There must be at one tab matching `http://example.com/`',
          )
        },
      },
      test,
    )

    await extension
      .testCount(1)
      .startup()
      .then((e) => e.unload())
  })
})
