<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  // @ts-check
  import { activeTabId, windowTabs } from '../windowApi/WindowTabs.js'
  import * as WebsiteViewApi from '../windowApi/WebsiteView.js'
  import Tab from './Tab.svelte'
  import { browserImports } from '../browserImports.js'
</script>

<ul role="tablist">
  {#each $windowTabs as tab}
    <Tab view={tab.view} />
  {/each}

  <div class="spacer" />
  <button
    on:click={() => {
      const newTab = {
        kind: 'website',
        view: WebsiteViewApi.create(
          browserImports.NetUtil.newURI('https://google.com'),
        ),
      }

      windowTabs.update((tabs) => [...tabs, newTab])
      activeTabId.set(newTab.view.windowBrowserId)
    }}>New Tab</button
  >
</ul>

<style>
  ul {
    padding: 0.5rem;
    margin: 0;

    min-width: 16rem;
    width: 16rem;

    display: flex;
    flex-direction: column;
  }

  .spacer {
    flex-grow: 1;
    flex-shrink: 1;
  }

  button {
    border: 0.25rem solid transparent;
    background: none;
    color: var(--theme-fg);
    padding: 0.5rem;
    border-radius: 1rem;
  }

  button:hover {
    border: 0.25rem solid var(--theme-active);
  }
</style>
