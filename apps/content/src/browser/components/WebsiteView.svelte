<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  // @ts-check
  import { onMount } from 'svelte'
  import { derived } from 'svelte/store'

  import RiRefreshLine from 'svelte-remixicon/RiRefreshLine.svelte'
  import RiArrowLeftLine from 'svelte-remixicon/RiArrowLeftLine.svelte'
  import RiArrowRightLine from 'svelte-remixicon/RiArrowRightLine.svelte'

  import * as WebsiteViewApi from '../windowApi/WebsiteView'
  import { activeTabId } from '../windowApi/WindowTabs'
  import ToolbarButton from './ToolbarButton.svelte'
  import ToolbarSpacer from './ToolbarSpacer.svelte'
  import UrlBox from './UrlBox.svelte'
  import HamburgurMenu from './HamburgurMenu.svelte'
  import { browserImports } from '../browserImports'
  import BrowserAction from './BrowserAction.svelte'

  /** @type {WebsiteView} */
  export let view
  /** @type {HTMLDivElement} */
  let browserContainer

  const actions = browserImports.EBrowserActions.actions

  const canGoBack = WebsiteViewApi.locationProperty(
    view,
    (browser) => browser.canGoBack,
    false,
  )
  const canGoForward = WebsiteViewApi.locationProperty(
    view,
    (browser) => browser.canGoForward,
    false,
  )

  onMount(() => browserContainer.append(view.browser))
</script>

<div
  class="website-view"
  id={`website-view-${view.windowBrowserId}`}
  hidden={$activeTabId !== view.windowBrowserId}
>
  <div class="toolbar">
    <ToolbarButton
      on:click={() => view.browser.goBack()}
      disabled={!$canGoBack}
    >
      <RiArrowLeftLine />
    </ToolbarButton>
    <ToolbarButton on:click={() => view.browser.reload()}>
      <RiRefreshLine />
    </ToolbarButton>
    <ToolbarButton
      on:click={() => view.browser.goForward()}
      disabled={!$canGoForward}
    >
      <RiArrowRightLine />
    </ToolbarButton>

    <ToolbarSpacer />

    <UrlBox {view} />

    <ToolbarSpacer />

    {#each Object.entries($actions) as [extId, action] (extId)}
      <BrowserAction browserView={view} {action} />
    {/each}
    <HamburgurMenu />
  </div>

  <div bind:this={browserContainer} class="browserContainer"></div>
</div>

<style>
  [hidden=''] {
    display: none !important;
  }

  .website-view {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .toolbar {
    display: flex;
    align-items: center;
    padding: 0.25rem;
  }

  .browserContainer {
    display: grid;
    flex-grow: 1;
  }

  .browserContainer :global(browser) {
    grid-area: 1/1;
  }
</style>
