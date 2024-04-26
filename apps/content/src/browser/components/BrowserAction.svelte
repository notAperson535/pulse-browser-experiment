<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  import { writable } from 'svelte/store'

  // @ts-check
  import ToolbarButton from './ToolbarButton.svelte'

  const actionPanel = import('./browserAction.js').then(
    (module) => module.actionPanel,
  )

  /** @type {import("resource://app/modules/EBrowserActions.sys.mjs").IBrowserAction} */
  export let action
  /** @type {WebsiteView} */
  export let browserView

  let launchTarget
  let open = writable(false)

  const iconSrc = action.getIcon(16)
  const url = action.getPopupUrl()
</script>

<ToolbarButton
  bind:buttonElement={launchTarget}
  on:click={async (e) => {
    open = true
    const { clickModifiersFromEvent } = await import('./browserAction.js')
    action.getEmiter().emit('click', {
      tabId: browserView.browserId,
      clickData: clickModifiersFromEvent(e),
    })
  }}
>
  <img src={$iconSrc} />
</ToolbarButton>

{#if $url}
  {#await actionPanel then ap}
    <xul:panel
      use:ap={{ url: $url, launchTarget, open }}
      on:close={() => (open = false)}
      class="popup"
      id={`page-action-panel__${action.getExtensionId()}--${
        browserView.browserId
      }`}
    ></xul:panel>
  {/await}
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
