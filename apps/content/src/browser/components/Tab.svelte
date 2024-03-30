<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  // @ts-check
  import RiCloseLine from 'svelte-remixicon/RiCloseLine.svelte'
  import {
    activeTabId,
    selectedTabIds,
    windowTabs,
    addSelectedTabs,
  } from '../windowApi/WindowTabs.js'
  import { readable } from 'svelte/store'
  import { dragTabIds, dragTabsTranslation } from './tabs__drag.js'

  /** @type {WebsiteView} */
  export let view

  const iconUrl = readable(view.iconUrl, (set) => {
    view.events.on('changeIcon', set)
    return () => view.events.off('changeIcon', set)
  })

  const pageTitle = readable(view.title, (set) => {
    view.events.on('changeTitle', set)
    return () => view.events.off('changeTitle', set)
  })

  $: isActive = $activeTabId === view.windowBrowserId
  $: isSelected = $selectedTabIds.includes(view.windowBrowserId)

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

  function closeSelected() {
    /** @type {number} */
    let nextIndex = 0

    windowTabs.update((tabs) => {
      const tabIndex = tabs.findIndex(
        (value) => value.view.windowBrowserId === view.windowBrowserId,
      )

      tabs = tabs.filter(
        (tab) =>
          $activeTabId != tab.view.windowBrowserId &&
          !$selectedTabIds.includes(tab.view.windowBrowserId),
      )

      nextIndex = nextTab(tabIndex, tabs)
      return tabs
    })

    return nextIndex
  }
</script>

<li role="presentation">
  <button
    draggable="true"
    role="tab"
    id={`tab-${view.windowBrowserId}`}
    aria-selected={isActive}
    data-not-active-selected={isSelected}
    data-window-browser-id={view.windowBrowserId}
    data-dragging={$dragTabIds.includes(view.windowBrowserId)}
    aria-controls={`website-view-${view.windowBrowserId}`}
    tabindex={isActive ? 0 : -1}
    style:transform={$dragTabIds.includes(view.windowBrowserId) ? `translateY(${$dragTabsTranslation}px)` : ''}
    on:mousedown={(event) => {
      if (event.ctrlKey) {
        addSelectedTabs([view.windowBrowserId])
        return
      }

      if (event.shiftKey) {
        const thisIndex = $windowTabs.findIndex(
          (tab) => tab.view.windowBrowserId === view.windowBrowserId,
        )
        const activeIndex = $windowTabs.findIndex(
          (tab) => tab.view.windowBrowserId === $activeTabId,
        )

        const tabsToSelect = $windowTabs
          .filter(
            (_, index) =>
              (thisIndex >= index && index >= activeIndex) ||
              (thisIndex <= index && index <= activeIndex),
          )
          .map((tab) => tab.view.windowBrowserId)
        addSelectedTabs(tabsToSelect)
        return
      }

      if ($activeTabId == view.windowBrowserId) {
        return
      }

      if ($selectedTabIds.includes(view.windowBrowserId)) {
        const oldActiveId = $activeTabId
        activeTabId.set(view.windowBrowserId)
        selectedTabIds.set([...$selectedTabIds, oldActiveId])
        return
      }

      selectedTabIds.set([])
      activeTabId.set(view.windowBrowserId)
    }}
    on:keydown={(e) => {
      const tabs = windowTabs()
      const tabIndex = tabs.findIndex(
        (value) => value.view.windowBrowserId === view.windowBrowserId,
      )
      let nextIndex = tabIndex

      if (e.key == 'Backspace' || e.key == 'Backspace') {
        nextIndex = closeSelected()
      }

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
    <img src={$iconUrl} />
    <span>{$pageTitle}</span>

    <div class="spacer" />

    <button class="close" tabindex="-1" on:click={() => closeSelected()}
      ><RiCloseLine /></button
    >
  </button>
</li>

<style>
  li {
    list-style: none;
    width: 100%;
  }

  button[role='tab'] {
    border: 0.25rem solid transparent;
    background: none;
    color: var(--theme-fg);

    text-align: left;
    padding: 0.5rem;
    width: 100%;

    border-radius: 1rem;

    display: flex;
    align-items: center;
  }

  button[role='tab'] span {
    padding-inline-start: 0.5rem;
  }

  button[role='tab']:hover,
  button[role='tab'][data-not-active-selected='true'] {
    border: 0.25rem solid var(--theme-active);
  }

  button[role='tab'][aria-selected='true'] {
    border: 0.25rem solid var(--theme-active);
    background-color: var(--theme-active);
  }

  button[role='tab'][data-dragging='true'], button[role='tab'][data-dragging='true'] * {
    pointer-events: none;
  }

  img {
    width: 1.5rem;
    height: 1.5rem;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
  }

  .spacer {
    flex-grow: 1;
    flex-shrink: 1;
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
