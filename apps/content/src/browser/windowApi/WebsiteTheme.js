/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
import Color from 'colorjs.io'

import { eventBus } from './eventBus.js'

/**
 * @param {WebsiteView} view
 */
export function registerViewThemeListener(view) {
  eventBus.on('themeUpdate', (theme) => {
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

  try {
    const colorObject = new Color(themeColor)
    const hue = colorObject.oklch[2]

    let lightness = colorObject.oklch[0] * 100
    let chroma = colorObject.oklch[1]

    const isLight = lightness > 50
    const withinSpec = isLight ? lightness >= 75 : lightness <= 25

    if (!withinSpec) {
      lightness = isLight ? 75 : 25
      chroma = isLight ? 0.12 : 0.04
    }

    const activeLightness = lightness + (isLight ? -5 : 5)
    const foregroundLightness = isLight ? 10 : 90

    const background = { lightness, chroma }
    const active = { lightness: activeLightness, chroma }
    const foreground = {
      lightness: foregroundLightness,
      chroma,
    }

    view.theme = { hue, background, foreground, active }
    view.events.emit('themeChange', view.theme)
  } catch (e) {
    console.warn('Theme generation failed', e)
  }
}
