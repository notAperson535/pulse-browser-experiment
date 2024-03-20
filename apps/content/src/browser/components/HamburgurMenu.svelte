<script>
  // @ts-check

  import RiMenuLine from "svelte-remixicon/RiMenuLine.svelte";
  import ToolbarButton from "./ToolbarButton.svelte"

  const lazy = {}
  ChromeUtils.defineESModuleGetters(lazy, {
    BrowserToolboxLauncher:
      'resource://devtools/client/framework/browser-toolbox/Launcher.sys.mjs',
  })

  let dropdownVisible = false

  /**
   * @param {*} a
   */
  const close = (a) => { dropdownVisible = false }
</script>

<div class="container">
  <ToolbarButton on:click={() => dropdownVisible = !dropdownVisible}>
    <RiMenuLine />
  </ToolbarButton>

  <div class="dropdown" hidden={!dropdownVisible}>
  <button on:click={() => close(lazy.BrowserToolboxLauncher.init())}
    >Open devtools</button
  >
  <button on:click={() => close(window.location.reload())}>Reload</button>
  </div>
</div>

<style>
  .container {
    position: relative;
  }

.dropdown[hidden=""] {
    display: none;
  }

  .dropdown {
    position: absolute;
    top: 3rem;
    right: 0;

    width: 24rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    padding: 0.5rem;
    background: var(--theme-bg);
    border-radius: 1rem;
    border: 0.25rem solid var(--theme-active);
  }

  button {
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    background: none;
  }

  button:hover {
    background-color: var(--theme-active);
  }
</style>



