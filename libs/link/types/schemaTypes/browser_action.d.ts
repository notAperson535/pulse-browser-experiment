// @not-mpl
// This file is generated from '../schemas/browser_action.json'. This file inherits its license
// Please check that file's license
//
// DO NOT MODIFY MANUALLY

declare module browser_action__manifest {
  type WebExtensionManifest__extended = {
    browser_action?: {
      default_icon?: IconPath
      default_popup?: string
      default_title?: string
      theme_icons?: ThemeIcons[]
      browser_style?: boolean
      default_area?: string
    }
  }
  type ApiGetterReturn = {
    manifest: {}
  }
}
declare module browser_action__browserAction {
  type ApiGetterReturn = {
    browserAction: {
      setTitle: (details: {
        title?: string
        tabId?: number
        windowId?: number
      }) => unknown
      getTitle: (details?: {
        tabId?: number
        windowId?: number
      }) => Promise<string | undefined>
      onClicked: EventApi<'browserAction', 'onClicked'>
    }
  }
}
