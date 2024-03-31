/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { manageTests } from './manager.js'
import { urlBox } from './tests/urlBox.test.js'

async function tests() {
  await urlBox()
}

await manageTests(tests)
