<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  // @ts-check
  import { onMount } from 'svelte'
  import RiPuzzleLine from 'svelte-remixicon/RiPuzzleLine.svelte'

  import * as PageActionApi from './pageAction.js'
  import UrlBoxButton from './UrlBoxButton.svelte'

  /** @type {import('resource://app/modules/EPageActions.sys.mjs').PageActionImpl} */
  export let pageAction

  const view = PageActionApi.setup(pageAction)
  const icons = PageActionApi.getIcons(view)
  const trigger = view.trigger
  const panel = view.panel

  /**
   * @param {Record<number, string>} icon
   * @param {number} preferredSize
   */
  function getIconUrlForPreferredSize(icon, preferredSize) {
    let bestSize

    if (icon[preferredSize]) {
      bestSize = preferredSize
    } else if (icon[preferredSize * 2]) {
      bestSize = preferredSize * 2
    } else {
      const sizes = Object.keys(icon)
        .map((key) => parseInt(key, 10))
        .sort((a, b) => a - b)
      bestSize =
        sizes.find((candidate) => candidate > preferredSize) || sizes.pop()
    }

    return icon[bestSize]
  }

  onMount(() => {
    return () => PageActionApi.cleanup(view)
  })
</script>

<UrlBoxButton bind:button={$trigger} on:click={PageActionApi.handleClick(view)}>
  {#if $icons}
    <img src={getIconUrlForPreferredSize($icons, 16)} />
  {:else}
    <RiPuzzleLine />
  {/if}
</UrlBoxButton>

{#if pageAction.popupUrl}
  <xul:panel bind:this={$panel} class="popup"></xul:panel>
{/if}

<style>
  .popup {
    --panel-padding: 0;
    --panel-border-radius: 1rem;
    --panel-border-color: transperent;
    --panel-shadow-margin: 1rem;
    --panel-background: transperent;
  }
</style>
