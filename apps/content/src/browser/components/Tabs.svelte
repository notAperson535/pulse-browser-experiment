<script>
  // @ts-check
  import { activeTabId, windowTabs } from '../windowApi/WindowTabs.js'
</script>

<ul role="tablist">
  {#each $windowTabs as tab, index}
    {@const selected = $activeTabId === tab.view.windowBrowserId}

    <li role="presentation">
      <button
        role="tab"
        id={`tab-${tab.view.windowBrowserId}`}
        aria-selected={selected}
        aria-controls={`website-view-${tab.view.windowBrowserId}`}
        tabindex={selected ? 0 : -1}
        on:click={() => activeTabId.set(tab.view.windowBrowserId)}
        on:keydown={(e) => {
          const tabs = windowTabs.readOnce()
          const tabIndex = tabs.findIndex(
            (value) => value.view.windowBrowserId === tab.view.windowBrowserId,
          )
          let nextIndex = tabIndex

          if (e.key == 'ArrowDown' || e.key == 'ArrowRight') {
            nextIndex = tabIndex + 1
            if (tabs.length <= nextIndex) {
              nextIndex = 0
            }

            const nextTab = tabs[nextIndex]
            activeTabId.set(nextTab.view.windowBrowserId)
          }

          if (e.key == 'ArrowUp' || e.key == 'ArrowLeft') {
            nextIndex = tabIndex - 1
            if (nextIndex < 0) {
              nextIndex = tabs.length - 1
            }

            const nextTab = tabs[nextIndex]
            activeTabId.set(nextTab.view.windowBrowserId)
          }

          if (nextIndex != tabIndex) {
            document.getElementById(`tab-${nextIndex}`)?.focus()
          }
        }}
      >
        Tab {index}
      </button>
    </li>
  {/each}
</ul>

<style>
  button[role='tab'][aria-selected='true'] {
    border-color: red;
  }
</style>
