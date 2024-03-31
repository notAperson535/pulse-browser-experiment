<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<script context="module">
  import { readable } from 'svelte/store'
  import { browserImports } from '../browserImports'

  const pageActions = readable(
    [...browserImports.EPageActions.pageActions.entries()],
    (set) => {
      const update = () =>
        set([...browserImports.EPageActions.pageActions.entries()])
      browserImports.EPageActions.events.on('*', update)
      return () => browserImports.EPageActions.events.off('*', update)
    },
  )
</script>

<script>
  // @ts-check
  import { writable } from 'svelte/store'
  import {
    RiEyeLine,
    RiLockLine,
    RiLockUnlockLine,
    RiQuestionLine,
  } from 'svelte-remixicon'

  import * as WebsiteViewApi from '../windowApi/WebsiteView.js'
  import * as UrlBoxApi from './urlBox.js'
  import { onMount } from 'svelte'
  import PageAction from './PageAction.svelte'
  import UrlBoxButton from './UrlBoxButton.svelte'

  /** @type {WebsiteView} */
  export let view

  let inputFocused = false

  const uri = WebsiteViewApi.locationProperty(
    view,
    (_, event) => event.aLocation,
    view.browser.browsingContext?.currentURI,
  )

  const security = readable(0, (set) => {
    view.events.on('securityChange', set)
    return () => view.events.off('securityChange', set)
  })
  const humanSecurity = UrlBoxApi.humanSecurityInfo(security)

  /** @type {HTMLInputElement?} */
  let input
  let activeIndex = 0
  /**
   * Represents the value that the _user_ has typed into the url bar. Not the value that is
   * set by other programs
   */
  const userValue = writable('')
  const value = writable('')

  $: fastAutocomplete = UrlBoxApi.getFastAutocomplete($userValue)
  $: slowAutocomplete = UrlBoxApi.debouncedSlowAutocomplete(userValue)
  $: hasAutocomplete =
    fastAutocomplete.length != 0 && $slowAutocomplete.length != 0

  $: {
    if (
      activeIndex != 0 &&
      activeIndex >= fastAutocomplete.length + $slowAutocomplete.length
    ) {
      activeIndex = 0
    }

    if (activeIndex < 0) {
      activeIndex = fastAutocomplete.length + $slowAutocomplete.length - 1
    }

    if (hasAutocomplete) {
      const completion =
        fastAutocomplete[activeIndex] ||
        $slowAutocomplete[activeIndex - fastAutocomplete.length]
      value.set(activeIndex === 0 ? $userValue : completion.url)
    }
  }

  /**
   * @param {UrlBoxApi.AutocompleteResult} completion
   */
  function selectCompletion(completion) {
    input?.blur()
    value.set(completion.url)
    WebsiteViewApi.goTo(view, browserImports.NetUtil.newURI(completion.url))
  }

  onMount(() => {
    if (input) {
      const style = UrlBoxApi.performCursedUrlStyling(input)
      const unsubscribe = uri.subscribe((uri) => {
        if (input) {
          input.value = decodeURI(uri?.spec || '')
          value.set(decodeURI(uri?.spec || ''))
          style()
        }
      })

      return () => unsubscribe()
    }
  })
</script>

<div class="url-box">
  <UrlBoxButton>
    {#if $humanSecurity.has('broken')}
      <RiEyeLine />
    {:else if $humanSecurity.has('insecure')}
      <RiLockUnlockLine />
    {:else if $humanSecurity.has('secure')}
      <RiLockLine />
    {:else}
      <RiQuestionLine />
    {/if}
  </UrlBoxButton>

  <input
    type="text"
    bind:this={input}
    bind:value={$value}
    on:focus={() => (inputFocused = true)}
    on:blur={() => (inputFocused = false)}
    on:input={() => userValue.set(input?.value || '')}
    on:keydown={(e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        return (activeIndex += 1)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        return (activeIndex -= 1)
      }
      if (e.key === 'Home') {
        e.preventDefault()
        return (activeIndex = 0)
      }
      if (e.key === 'End') {
        e.preventDefault()
        return (activeIndex =
          fastAutocomplete.length + $slowAutocomplete.length - 1)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        selectCompletion(
          fastAutocomplete[activeIndex] ||
            $slowAutocomplete[activeIndex - fastAutocomplete.length],
        )
        return
      }
    }}
    aria-autocomplete="list"
    aria-controls="completions"
  />

  {#each $pageActions as [_, pageAction]}
    <PageAction {pageAction} />
  {/each}

  <div
    hidden={!(inputFocused && hasAutocomplete)}
    class="completions"
    role="listbox"
    tabindex="0"
    aria-activedescendant={`completion-${activeIndex}`}
  >
    {#each fastAutocomplete as result, index}
      <div
        class="completion"
        id={`completion-${index}`}
        role="option"
        tabindex="-1"
        aria-selected={activeIndex === index}
      >
        {result.display}
      </div>
    {/each}

    {#if $slowAutocomplete.length != 0}
      <div>Suggestions</div>
    {/if}

    {#each $slowAutocomplete as result, index}
      {@const itemIndex = index + fastAutocomplete.length}

      <div
        class="completion"
        id={`completion-${itemIndex}`}
        role="option"
        tabindex="-1"
        aria-selected={activeIndex === itemIndex}
      >
        {result.display}
      </div>
    {/each}
  </div>
</div>

<style>
  .url-box {
    display: flex;
    align-items: center;

    flex-grow: 2;
    position: relative;
    height: 2.5rem;
    padding: 0 2px;
    gap: 0.125rem;

    border: 0.25rem solid var(--theme-active);
    border-radius: 1rem;
  }

  .url-box:has(+ .container > input:focus) {
    outline: solid;
  }

  input {
    color: var(--theme-fg);
  }

  input:focus {
    outline: none;
  }

  .url-box input {
    width: 100%;
    height: 100%;

    border: none;
    background: none;
    margin: 0;
  }

  .completions {
    position: absolute;
    top: 3rem;
    width: 100%;

    padding: 0.5rem;
    padding-top: 0;
    background: var(--theme-bg);
    border-radius: 1rem;
    border: 0.25rem solid var(--theme-active);
  }

  .completion {
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    margin-top: 0.5rem;
  }

  .completion[aria-selected='true'] {
    background-color: var(--theme-active);
  }
</style>
