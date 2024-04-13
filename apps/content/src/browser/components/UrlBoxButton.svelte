<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  export let disabled = false
  /** @type {string | undefined} */
  export let id = undefined
  /** @type {HTMLButtonElement | undefined} */
  export let button = undefined
</script>

<button on:click bind:this={button} {disabled} {id}>
  <slot />
</button>

<style>
  button {
    border: none;
    background: none;

    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.75rem;

    flex-grow: 0;
    flex-shrink: 0;

    display: flex;
    justify-content: center;
    align-items: center;

    color: var(--theme-fg);
    -moz-context-properties: fill, fill-opacity;
    fill: currentColor;
  }

  button:not(:disabled):hover {
    background-color: var(--theme-active);
  }

  button:disabled :global(svg) {
    opacity: 0.5;
  }
</style>
