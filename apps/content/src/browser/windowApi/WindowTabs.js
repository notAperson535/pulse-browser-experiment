// @ts-check
import { derived } from 'svelte/store'

import { browserImports } from '../browserImports.js'
import { viewableWritable } from '../utils/readableWritable.js'
import * as WebsiteViewApi from './WebsiteView.js'

export const activeTabId = viewableWritable(0)

/**
 * @type {import('../utils/readableWritable.js').ViewableWritable<{ kind: 'tab', view: WebsiteView }[]>}
 */
export const windowTabs = viewableWritable([
  {
    kind: 'tab',
    view: WebsiteViewApi.create(
      browserImports.NetUtil.newURI('https://google.com'),
    ),
  },
  {
    kind: 'tab',
    view: WebsiteViewApi.create(
      browserImports.NetUtil.newURI('https://svelte.dev'),
    ),
  },
])

export const activeTab = derived(
  [activeTabId, windowTabs],
  ([$activeTabId, $windowTabs]) =>
    $windowTabs.find((tab) => tab.view.windowBrowserId === $activeTabId),
)

activeTabId.set(windowTabs.readOnce()[0].view.windowBrowserId)
