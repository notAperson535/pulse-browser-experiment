<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  // @ts-check
  import { windowTabs } from '../windowApi/WindowTabs.js'
  import Tab from './Tab.svelte'
</script>

<ul role="tablist">
  {#each $windowTabs as tab, index}
    <Tab view={tab.view} {index} />
  {/each}
</ul>

<style>
  ul {
    padding: 0.5rem;
    margin: 0;

    min-width: 16rem;
    width: 16rem;
  }
</style>
