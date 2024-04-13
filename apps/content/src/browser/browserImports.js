/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
import { lazyESModuleGetters } from '../shared/lazy.js'

export const browserImports = lazyESModuleGetters({
  AppConstants: 'resource://gre/modules/AppConstants.sys.mjs',
  E10SUtils: 'resource://gre/modules/E10SUtils.sys.mjs',
  EPageActions: 'resource://app/modules/EPageActions.sys.mjs',
  NetUtil: 'resource://gre/modules/NetUtil.sys.mjs',
  PageThumbs: 'resource://gre/modules/PageThumbs.sys.mjs',
  WindowTracker: 'resource://app/modules/BrowserWindowTracker.sys.mjs',
})
