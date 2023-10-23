/// <reference path="../link.d.ts" />

import { FaviconLoader } from 'resource://app/modules/FaviconLoader.sys.mjs'

export class LinkHandlerChild extends JSWindowActorChild {
  iconLoader = new FaviconLoader(this)
  loadedTabIcon = false

  /**
   * If we haven't already loaded a more specific favicon, we will load the default icon,
   * generally located at `/favicon.ico`, although there is extra logic
   */
  fetchRootFavicon() {
    if (this.loadedTabIcon) return

    const pageURI = this.document.documentURIObject
    if (['http', 'https'].includes(pageURI.scheme)) {
      this.loadedTabIcon = true
      this.iconLoader.addDefaultIcon(pageURI)
    }
  }

  onPageShow(event) {
    if (event.target != this.document) return
    this.fetchRootFavicon()
    if (this.iconLoader) this.iconLoader.onPageShow()
  }

  onPageHide(event) {
    if (event.target != this.document) return
    if (this.iconLoader) this.iconLoader.onPageHide()
    this.loadedTabIcon = false
  }

  onHeadParsed(event) {
    if (event.target.ownerDocument != this.document) return
    this.fetchRootFavicon()
    if (this.iconLoader) this.iconLoader.onPageShow()
  }

  onLinkEvent(event) {
    let link = event.target
    // Ignore sub-frames (bugs 305472, 479408).
    if (link.ownerGlobal != this.contentWindow) {
      return
    }

    let rel = link.rel && link.rel.toLowerCase()
    // We also check .getAttribute, since an empty href attribute will give us
    // a link.href that is the same as the document.
    if (!rel || !link.href || !link.getAttribute('href')) {
      return
    }

    // Note: following booleans only work for the current link, not for the
    // whole content
    let iconAdded = false
    let searchAdded = false
    let rels = {}
    for (let relString of rel.split(/\s+/)) {
      rels[relString] = true
    }

    for (let relVal in rels) {
      let isRichIcon = false

      switch (relVal) {
        case 'apple-touch-icon':
        case 'apple-touch-icon-precomposed':
        case 'fluid-icon':
          isRichIcon = true
        // fall through
        case 'icon':
          if (iconAdded || link.hasAttribute('mask')) {
            // Masked icons are not supported yet.
            break
          }

          if (!Services.prefs.getBoolPref('browser.chrome.site_icons', true)) {
            return
          }

          if (this.iconLoader.addIconFromLink(link, isRichIcon)) {
            iconAdded = true
            if (!isRichIcon) {
              this.seenTabIcon = true
            }
          }
          break
        case 'search':
          if (
            Services.policies &&
            !Services.policies.isAllowed('installSearchEngine')
          ) {
            break
          }

          if (!searchAdded && event.type == 'DOMLinkAdded') {
            let type = link.type && link.type.toLowerCase()
            type = type.replace(/^\s+|\s*(?:;.*)?$/g, '')

            // Note: This protocol list should be kept in sync with
            // the one in OpenSearchEngine's install function.
            let re = /^https?:/i
            if (
              type == 'application/opensearchdescription+xml' &&
              link.title &&
              re.test(link.href)
            ) {
              let engine = { title: link.title, href: link.href }
              this.sendAsyncMessage('Link:AddSearch', {
                engine,
              })
              searchAdded = true
            }
          }
          break
      }
    }
  }

  handleEvent(event) {
    console.log('LinkHandlerChild', event)

    switch (event.type) {
      case 'pageshow':
        return this.onPageShow(event)
      case 'pagehide':
        return this.onPageHide(event)
      case 'DOMHeadElementParsed':
        return this.onHeadParsed(event)
      default:
        return this.onLinkEvent(event)
    }
  }
}
