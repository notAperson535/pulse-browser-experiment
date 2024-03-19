// @ts-check
/// <reference types="@browser/link" />

export class ThemeMetaParent extends JSWindowActorParent {
  receiveMessage(aMsg) {
    /** @type {Window} */
    const win = this.browsingContext.topChromeWindow

    if (aMsg.name === 'Theme:ColorsUpdated') {
      win.eventBus.emit('themeUpdate', {
        ...aMsg.data,
        browserId: this.browsingContext.embedderElement.browserId,
      })
    }
  }
}
