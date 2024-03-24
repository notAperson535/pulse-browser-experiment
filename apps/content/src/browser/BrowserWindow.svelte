<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  // @ts-check
  import { derived } from 'svelte/store'

  import WebsiteView from './components/WebsiteView.svelte'
  import Tabs from './components/Tabs.svelte'
  import { windowTabs, activeTab } from './windowApi/WindowTabs.js'

  const theme = derived(activeTab, ($activeTab, set) => {
    set($activeTab.view.theme)
    $activeTab.view.events.on('themeChange', set)
    return () => $activeTab.view.events.off('themeChange', set)
  })

  $: tabs = $windowTabs.toSorted(
    (a, b) => a.view.windowBrowserId - b.view.windowBrowserId,
  )

  $: hue = $theme?.hue
  $: bg = $theme?.background
  $: fg = $theme?.foreground
  $: active = $theme?.active

  /**
   * @param {number} hue
   * @param {OklchThemeVariant} rest
   * @returns {string}
   */
  function renderThemeVariable(hue, rest) {
    return `oklch(${rest.lightness}% ${rest.chroma} ${hue})`
  }
</script>

<div
  class="container"
  style={$theme &&
    `--theme-fg: ${renderThemeVariable(
      hue,
      fg,
    )};--theme-bg: ${renderThemeVariable(
      hue,
      bg,
    )};--theme-active: ${renderThemeVariable(hue, active)};`}
>
  <Tabs />

  <div class="tabs">
    {#each tabs as tab}
      <WebsiteView view={tab.view} />
    {/each}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-grow: 1;

    background-color: var(--theme-bg);
    color: var(--theme-fg);

    transition:
      background-color 0.2s,
      color 0.2s;
  }

  .tabs {
    display: flex;
    flex-grow: 1;
    height: 100%;
  }
</style>
