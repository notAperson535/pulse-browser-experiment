// @ts-check
/// <reference types="@browser/link" />

/**
 * @typedef {object} CurrentPageColors
 * @property {string} [meta]
 * @property {string} [body]
 */

export class ThemeMetaChild extends JSWindowActorChild {
  /** @type {CurrentPageColors} */
  currentColorOptions = {}

  /**
   * @param {DOMMetaAddedEvent|DOMMetaChangedEvent} event
   */
  handleMetaEvent(event) {
    const { target } = event

    if (target.name === 'theme-color') {
      this.currentColorOptions.meta =
        target.getAttribute('content') || undefined

      this.sendUpdatedThemeColors()
    }
  }

  /**
   * @param {PageShowEvent} event
   */
  handlePageLoad(event) {
    const document = event.target
    this.currentColorOptions.body = this.contentWindow.getComputedStyle(
      document.body,
    ).background

    this.sendUpdatedThemeColors()
  }

  sendUpdatedThemeColors() {
    this.sendAsyncMessage('Theme:ColorsUpdated', this.currentColorOptions)
  }

  /**
   * @param {PageShowEvent | DOMMetaAddedEvent | DOMMetaChangedEvent} event
   */
  handleEvent(event) {
    switch (event.type) {
      case 'DOMMetaAdded':
      case 'DOMMetaChanged':
        return this.handleMetaEvent(event)
      case 'pageshow':
        return this.handlePageLoad(event)
    }
  }
}
