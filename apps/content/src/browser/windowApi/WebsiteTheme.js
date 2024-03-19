// @ts-check
import Color from 'colorjs.io'

import { eventBus } from './eventBus.js'

/**
 * @param {WebsiteView} view
 */
export function registerViewThemeListener(view) {
  eventBus.on('themeUpdate', (theme) => {
    console.log(theme.browserId, view.browserId)
    if (theme.browserId != view.browserId) {
      return
    }

    applyTheme(view, theme)
  })
}

/**
 * @param {WebsiteView} view
 * @param {import('@browser/event-bus').ThemeUpdate} theme
 */
export function applyTheme(view, theme) {
  const themeColor = theme.meta || theme.body

  if (!themeColor) {
    return
  }

  const colorObject = new Color(themeColor)
  const hue = colorObject.oklch[2]

  const background = {
    lightness: colorObject.oklch[0] * 100,
    chroma: colorObject.oklch[1],
  }
  let foreground = {
    ...background,
    lightness: 0,
  }

  // From a bit of experimenting, the following text lightness have the following exteme background color:
  // - 5%: 57%
  // - 95%: 52%
  // Which incedently makes 50% the roughly good cutof point
  // TODO: Shift the lightness if it is too close to 50%
  if (background.lightness > 50) {
    foreground.lightness = 5
  } else {
    foreground.lightness = 95
  }

  view.theme = { hue, background, foreground }
  view.events.emit('themeChange', view.theme)
}
