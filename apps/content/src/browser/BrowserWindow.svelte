<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  // @ts-check
  import { readable } from 'svelte/store'

  import WebsiteView from './components/WebsiteView.svelte'
  import * as WebsiteViewApi from './windowApi/WebsiteView.js'
  import { browserImports } from './browserImports.js'

  const view = WebsiteViewApi.create(
    browserImports.NetUtil.newURI('https://google.com'),
  )

  // TODO: Move this code somewhere closer to websiteview
  const theme = readable(view.theme, (set) => {
    view.events.on('themeChange', set)
    return () => view.events.off('themeChange', set)
  })

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
  <WebsiteView {view} />
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;

    background-color: var(--theme-bg);
    color: var(--theme-fg);

    transition:
      background-color 0.2s,
      color 0.2s;
  }
</style>
