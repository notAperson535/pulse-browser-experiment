// @not-mpl
// This file is generated from '../schemas/tabs.json'. This file inherits its license
// Please check that file's license
//
// DO NOT MODIFY MANUALLY

declare module tabs__manifest {
  type ApiGetterReturn = {
    manifest: {}
  }
}
declare module tabs__tabs {
  type Tab = {
    id?: number
    index: number
    active: boolean
    highlighted: boolean
    title?: string
    url?: string
    windowId: number
  }
  type QueryInfo = {
    active?: boolean
    title?: string
    url?: string | string[]
    windowId?: number
  }
  type UpdateInfo = {
    active?: boolean
    highlighted?: boolean
    url?: string
  }
  type TabStatus = 'loading' | 'complete'
  type ApiGetterReturn = {
    tabs: {
      get: (tabId: number) => Promise<Tab>
      goBack: (tabId?: number) => unknown
      goForward: (tabId?: number) => unknown
      query: (queryInfo: QueryInfo) => Promise<Tab[]>
      remove: (tabIds: number | number[]) => unknown
      reload: (tabIds: number | number[]) => unknown
      update: (tabId: number, updateProperties: UpdateInfo) => unknown
    }
  }
}
