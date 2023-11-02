/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { lazyESModuleGetters } from '../../shared/TypedImportUtilities'

export let resource = lazyESModuleGetters({
  E10SUtils: 'resource://gre/modules/E10SUtils.sys.mjs',
  NetUtil: 'resource://gre/modules/NetUtil.sys.mjs',
})