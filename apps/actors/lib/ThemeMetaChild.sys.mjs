/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
    this.currentColorOptions.body =
      this.getHeaderColor(document.body, document.body) || undefined

    this.sendUpdatedThemeColors()
  }

  /**
   * @param {HTMLElement} element
   * @param {HTMLElement} body
   * @returns {string | null}
   */
  getHeaderColor(element, body) {
    if (!element.getBoundingClientRect) {
      return null
    }

    if (element != body && element.getBoundingClientRect().y != 0) {
      return null
    }

    let elementColor = null

    if (element.firstChild) {
      elementColor = this.getHeaderColor(element.firstChild, body)
    }

    if (!elementColor) {
      elementColor = this.contentWindow.getComputedStyle(element).background
      if (
        elementColor.toLowerCase() == 'none' ||
        elementColor.toLowerCase() == 'transperent'
      ) {
        return null
      }
    }

    return elementColor
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
