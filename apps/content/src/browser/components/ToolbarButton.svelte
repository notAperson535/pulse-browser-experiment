<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script>
  export let disabled = false
</script>

<button on:click {disabled}>
  <slot />
</button>

<style>
  button {
    border: none;
    background: none;

    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;

    display: flex;
    justify-content: center;
    align-items: center;

    color: var(--theme-fg);
  }

  button:not(:disabled):hover {
    background-color: var(--theme-active);
  }

  button:disabled :global(svg) {
    opacity: 0.5;
  }
</style>
