declare module '@browser/event-bus' {
  import { Emitter } from 'mitt'

  export type ThemeUpdate = {
    browserId: number
    meta?: string
    body?: string
  }

  export type EventBus = Emitter<{
    themeUpdate: ThemeUpdate
  }>
}
