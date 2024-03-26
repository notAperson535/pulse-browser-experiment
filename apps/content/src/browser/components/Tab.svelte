<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  // @ts-check
  import RiCloseLine from 'svelte-remixicon/RiCloseLine.svelte'
  import { activeTabId, windowTabs } from '../windowApi/WindowTabs.js'
  import { readable } from 'svelte/store'

  /** @type {WebsiteView} */
  export let view
  /** @type {number} */
  export let index

  const iconUrl = readable(view.iconUrl, (set) => {
    view.events.on('changeIcon', set)
    return () => view.events.off('changeIcon', set)
  })

  $: selected = $activeTabId === view.windowBrowserId

  /**
   * @param {import('../windowApi/WindowTabs.js').WebsiteTab[]} tabs
   * @param {number} tabIndex
   */
  function nextTab(tabIndex, tabs) {
    let nextIndex = tabIndex + 1
    if (tabs.length <= nextIndex) {
      nextIndex = 0
    }

    const nextTab = tabs[nextIndex]
    activeTabId.set(nextTab.view.windowBrowserId)
    return nextIndex
  }

  /**
   * @param {import('../windowApi/WindowTabs.js').WebsiteTab[]} tabs
   * @param {number} tabIndex
   */
  function prevTab(tabIndex, tabs) {
    let nextIndex = tabIndex - 1
    if (nextIndex < 0) {
      nextIndex = tabs.length - 1
    }

    const nextTab = tabs[nextIndex]
    activeTabId.set(nextTab.view.windowBrowserId)
    return nextIndex
  }
</script>

<li role="presentation">
  <button
    role="tab"
    id={`tab-${view.windowBrowserId}`}
    aria-selected={selected}
    aria-controls={`website-view-${view.windowBrowserId}`}
    tabindex={selected ? 0 : -1}
    on:click={() => activeTabId.set(view.windowBrowserId)}
    on:keydown={(e) => {
      const tabs = windowTabs.readOnce()
      const tabIndex = tabs.findIndex(
        (value) => value.view.windowBrowserId === view.windowBrowserId,
      )
      let nextIndex = tabIndex

      if (e.key == 'ArrowDown' || e.key == 'ArrowRight') {
        nextIndex = nextTab(nextIndex, tabs)
      }

      if (e.key == 'ArrowUp' || e.key == 'ArrowLeft') {
        nextIndex = prevTab(nextIndex, tabs)
      }

      if (nextIndex != tabIndex) {
        document.getElementById(`tab-${nextIndex}`)?.focus()
      }
    }}
  >
    <img src={$iconUrl} alt="Tab favicon" />
    <span>Tab {index}</span>
    <button
      class="close"
      tabindex="-1"
      on:click={() =>
        windowTabs.update((tabs) => {
          const tabIndex = tabs.findIndex(
            (value) => value.view.windowBrowserId === view.windowBrowserId,
          )
          nextTab(tabIndex, tabs)

          let restOfTabs = tabs.filter(
            (value) => value.view.windowBrowserId != view.windowBrowserId,
          )
          return restOfTabs
        })}><RiCloseLine /></button
    >
  </button>
</li>

<style>
  li {
    list-style: none;
  }

  button[role='tab'] {
    border: 0.25rem solid transparent;
    background: none;
    color: var(--theme-fg);

    min-width: 16rem;
    text-align: left;
    padding: 0.5rem;
    margin-bottom: 0.25rem;

    border-radius: 1rem;

    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  button[role='tab'] span {
    padding-inline-start: 0.25rem;
  }

  button[role='tab']:hover {
    border: 0.25rem solid var(--theme-active);
  }

  button[role='tab'][aria-selected='true'] {
    border: 0.25rem solid var(--theme-active);
    background-color: var(--theme-active);
  }

  img {
    width: 1.5rem;
    height: 1.5rem;
  }

  .close {
    --hover-color: var(--theme-active);

    margin: 0;
    padding: 0.25rem;
    border: none;
    border-radius: 0.5rem;
    background: none;
    color: var(--theme-fg);

    height: 1rem;
    box-sizing: content-box;
  }

  button[role='tab'][aria-selected='true'] .close {
    --hover-color: var(--theme-bg);
  }

  .close:hover {
    background-color: var(--hover-color);
  }
</style>
