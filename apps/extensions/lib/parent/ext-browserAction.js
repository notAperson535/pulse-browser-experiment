/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @ts-check
/// <reference path="../types/index.d.ts" />
/// <reference path="./ext-browser.js" />
/// <reference types="@browser/link" />

this.browserAction = class extends ExtensionAPIPersistent {
  /** @type {import("resource://app/modules/EBrowserActions.sys.mjs").IBrowserAction | undefined} */
  browserAction

  async onManifestEntry() {
    const { extension } = this
    const options = extension.manifest.browser_action

    if (!options) {
      return
    }

    this.browserAction = lazy.EBrowserActions.BrowserAction(extension.id, {
      icons: lazy.ExtensionParent.IconDetails.normalize(
        {
          path: options.default_icon || extension.manifest.icons,
          iconType: 'browserAction',
          themeIcon: options.theme_icons,
        },
        extension,
      ),
      title: options.default_title || extension.id,
      popupUrl: options.default_popup,
    })
    this.browserAction.getEmiter().on('click', (v) => this.emit('click', v))

    lazy.EBrowserActions.actions.addKey(extension.id, this.browserAction)
  }

  onShutdown() {
    lazy.EBrowserActions.actions.removeKey(this.extension.id)
  }

  PERSISTENT_EVENTS = {
    /**
     * @param {object}             options
     * @param {object}             options.fire
     * @param {function}           options.fire.async
     * @param {function}           options.fire.sync
     * @param {function}           options.fire.raw
     *        For primed listeners `fire.async`/`fire.sync`/`fire.raw` will
     *        collect the pending events to be send to the background context
     *        and implicitly wake up the background context (Event Page or
     *        Background Service Worker), or forward the event right away if
     *        the background context is running.
     * @param {function}           [options.fire.wakeup = undefined]
     *        For primed listeners, the `fire` object also provide a `wakeup` method
     *        which can be used by the primed listener to explicitly `wakeup` the
     *        background context (Event Page or Background Service Worker) and wait for
     *        it to be running (by awaiting on the Promise returned by wakeup to be
     *        resolved).
     * @param {ProxyContextParent} [options.context=undefined]
     *        This property is expected to be undefined for primed listeners (which
     *        are created while the background extension context does not exist) and
     *        to be set to a ProxyContextParent instance (the same got by the getAPI
     *        method) when the method is called for a listener registered by a
     *        running extension context.
     */
    onClicked({ fire }) {
      const /** @type {Extension} */ extension = this.extension

      /**
       * @param {import("resource://app/modules/EBrowserActions.sys.mjs").IBrowserActionEvents['click']} clickInfo
       */
      const callback = async (_name, clickInfo) => {
        if (fire.wakeup) await fire.wakeup()

        const tab = extension.tabManager.get(clickInfo.tabId)
        fire.sync(tab.convert(), clickInfo.clickData)
      }

      this.on('click', callback)
      return {
        unregister: () => {
          this.off('click', callback)
        },
        convert(newFire) {
          fire = newFire
        },
      }
    },
  }

  /** @returns {browser_action__browserAction.ApiGetterReturn} */
  // eslint-disable-next-line no-unused-vars
  getAPI(context) {
    const { browserAction } = this

    return {
      browserAction: {
        setTitle({ title }) {
          // TODO: Tab & Window implementation
          browserAction?.setTitle(title)
        },
        async getTitle() {
          // TODO: Tab & Window impl
          return browserAction?.getTitle().get()
        },

        onClicked: new EventManager({
          context,
          module: 'browserAction',
          event: 'onClicked',
          inputHandling: true,
          extensionApi: this,
        }).api(),
      },
    }
  }
}
