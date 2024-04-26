/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
import { ExtensionTestUtils } from 'resource://app/modules/ExtensionTestUtils.sys.mjs'
import { TestManager } from 'resource://app/modules/TestManager.sys.mjs'
import { lazyESModuleGetters } from 'resource://app/modules/TypedImportUtils.sys.mjs'

const lazy = lazyESModuleGetters({
  EBrowserActions: 'resource://app/modules/EBrowserActions.sys.mjs',
})

/** @param {number} len */
const delay =
  (len) =>
  /**
   * @template T
   * @param {T} v
   * @returns {Promise<T>}
   */ (v) =>
    new Promise((res) => setTimeout(() => res(v), len))

/**
 * @param {() => Promise<unknown>} fn
 * @param {number} timeout
 */
const timeoutFail = (fn, timeout) =>
  Promise.race([delay(timeout)(false), fn().then(() => true)])

await TestManager.withBrowser(['http://example.com/'], async (window) => {
  await TestManager.test('browserAction - Icon & Panel', async (test) => {
    const extension = ExtensionTestUtils.loadExtension(
      {
        manifest: {
          browser_action: {
            default_icon: './flask-line.svg',
            default_popup: 'browseraction.html',
            default_title: 'pageaction title',
          },
        },
        async background() {
          /** @type {import('resource://app/modules/ExtensionTestUtils.sys.mjs').TestBrowser} */
          const b = this.browser

          b.test.onMessage.addListener(async () => {
            b.test.assertEq(
              'pageaction title',
              await b.browserAction.getTitle({}),
              'Page action title should match default',
            )

            await b.browserAction.setTitle({ title: 'new title' })

            b.test.assertEq(
              'new title',
              await b.browserAction.getTitle({}),
              'Page action title should have updated',
            )
            b.test.sendMessage('done')
          })

          b.browserAction.onClicked.addListener((tab, info) => {
            b.test.sendMessage('clicked')
          })
        },
        files: {
          'flask-line.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.9994 2V4H14.9994V7.24291C14.9994 8.40051 15.2506 9.54432 15.7357 10.5954L20.017 19.8714C20.3641 20.6236 20.0358 21.5148 19.2836 21.8619C19.0865 21.9529 18.8721 22 18.655 22H5.34375C4.51532 22 3.84375 21.3284 3.84375 20.5C3.84375 20.2829 3.89085 20.0685 3.98181 19.8714L8.26306 10.5954C8.74816 9.54432 8.99939 8.40051 8.99939 7.24291V4H7.99939V2H15.9994ZM13.3873 10.0012H10.6115C10.5072 10.3644 10.3823 10.7221 10.2371 11.0724L10.079 11.4335L6.12439 20H17.8734L13.9198 11.4335C13.7054 10.9691 13.5276 10.4902 13.3873 10.0012ZM10.9994 7.24291C10.9994 7.49626 10.9898 7.7491 10.9706 8.00087H13.0282C13.0189 7.87982 13.0119 7.75852 13.0072 7.63704L12.9994 7.24291V4H10.9994V7.24291Z"></path></svg>`,
          'browseraction.html': `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body>
              <h1>Hello world</h1>
            </body>
          </html>`,
        },
      },
      test,
    )

    await extension
      .testCount(2)
      .startup()
      .then(delay(100))
      .then((e) => {
        test.truthy(
          lazy.EBrowserActions.actions.key(extension.extension.id),
          'Browser action should be registered',
        )
        test.equals(
          lazy.EBrowserActions.actions
            .key(extension.extension.id)
            ?.getTitle()
            .get(),
          'pageaction title',
          'Title is saved correctly',
        )
        return e
      })
      .then((e) => e.sendMsg(''))
      .then((e) => e.awaitMsg('done'))
      .then(async (e) => {
        const action = lazy.EBrowserActions.actions.key(extension.extension.id)
        test.equals(action?.getTitle().get(), 'new title', 'Title updated')

        action
          ?.getEmiter()
          .emit('click', { clickData: { modifiers: [], button: 0 } })
        test.truthy(
          await timeoutFail(() => e.awaitMsg('clicked'), 10),
          'Click event was passed in a timely manner',
        )

        return e
      })
      .then((e) => e.unload())
  })
})
