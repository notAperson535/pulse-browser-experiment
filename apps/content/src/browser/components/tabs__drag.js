// @ts-check
import { writable } from '@amadeus-it-group/tansu'

import { browserImports } from '../browserImports.js'
import {
  activeTabId,
  selectedTabIds,
  windowTabs,
} from '../windowApi/WindowTabs.js'

const WINDOW_ID_TYPE = 'text/x-fushra-window-id'
const WINDOW_BROWSER_IDS_TYPE = 'text/x-fushra-window-browser-ids'

/** @type {import('@amadeus-it-group/tansu').WritableSignal<number[]>} */
export let dragTabIds = writable([])
export let dragTabsTranslation = writable(0)

let startEventRelativeY = 0
let lastScreenY = 0
let startingIndex = 0
let expectedIndex = 0
/** @type {HTMLCanvasElement | null} */
let dndCanvas = null
/** @type {XULPanel | null} */
let linuxDragPanel = null

/**
 * @param {DragEvent} event
 */
export function dragStart(event) {
  const activeId = activeTabId()
  const active = windowTabs().find(
    (tab) => tab.view.windowBrowserId == activeId,
  )
  const selectedIds = selectedTabIds()

  dragTabIds.set([activeId, ...selectedIds])

  if (event.dataTransfer) {
    // TODO: Multiwindow
    event.dataTransfer.setData(WINDOW_ID_TYPE, '0')
    event.dataTransfer.setData(WINDOW_BROWSER_IDS_TYPE, dragTabIds().join(','))
  }

  {
    /** @type {HTMLButtonElement} */
    const target = event.target
    const rect = target.getBoundingClientRect()

    startEventRelativeY = event.screenY - rect.y
    startingIndex = Number(target.dataset.index)
  }

  if (dragTabIds().length != 1) {
    groupDraggedTabs()
  }

  if (active) {
    const scale = window.devicePixelRatio

    if (!dndCanvas) {
      dndCanvas = document.createElement('canvas')
      dndCanvas.style.width = '100%'
      dndCanvas.style.height = '100%'
      dndCanvas.mozOpaque = true
    }

    dndCanvas.width = 180 * scale
    dndCanvas.height = 90 * scale

    var context = dndCanvas.getContext('2d')
    context.fillStyle = 'white'
    context.fillRect(0, 0, dndCanvas.width, dndCanvas.height)

    /** @type {HTMLElement} */
    let toDrag = dndCanvas
    let handleUpdate = () =>
      event.dataTransfer?.updateDragImage(dndCanvas, -16, -16)

    // The GTK backend does not have support for updateDragImage?? Mozilla's hack is to use a panel
    // to have the drag image contained, which I don't really like
    if (browserImports.AppConstants.platform == 'linux') {
      if (!linuxDragPanel) {
        linuxDragPanel =
          /** @type {XULPanel} */ document.createXULElement('panel')
        linuxDragPanel.className = 'dragfeedback-tab'
        linuxDragPanel.setAttribute('type', 'drag')
        linuxDragPanel?.append(dndCanvas)
        document.documentElement.append(linuxDragPanel)
      }

      toDrag = linuxDragPanel
      handleUpdate = () => {}
    }

    event.dataTransfer?.setDragImage(toDrag, -16, -16)

    browserImports.PageThumbs.captureToCanvas(
      active.view.browser,
      dndCanvas,
      undefined,
    )
      .then(handleUpdate)
      .catch(console.error)
  }
}

/**
 * @param {DragEvent} event
 */
export function dragOver(event) {
  event.preventDefault()
  event.stopPropagation()

  animateTabMove(event)
}

/**
 * @param {DragEvent} event
 */
export function dragEnd(event) {
  windowTabs.update((tabs) => {
    if (dragTabIds().length == 0) {
      return tabs
    }

    const targetBrowserId =
      tabs[Math.min(expectedIndex, tabs.length - 1)].view.windowBrowserId
    if (dragTabIds()[0] == targetBrowserId) {
      return tabs
    }

    const draggingTabs = tabs.filter((tab) =>
      dragTabIds().includes(tab.view.windowBrowserId),
    )
    return tabs
      .filter((tab) => !dragTabIds().includes(tab.view.windowBrowserId))
      .flatMap((tab) => {
        if (tab.view.windowBrowserId == targetBrowserId) {
          if (expectedIndex < startingIndex) {
            return [...draggingTabs, tab]
          }

          return [tab, ...draggingTabs]
        }

        return tab
      })
  })

  dragTabIds.set([])
  dragTabsTranslation.set(0)

  startEventRelativeY = 0
  lastScreenY = 0

  document
    .querySelectorAll("button[role='tab']")
    .forEach(
      (/** @type {HTMLButtonElement} */ tab) => void (tab.style.transform = ''),
    )
}

function groupDraggedTabs() {
  if (dragTabIds().length == 0) {
    console.warn('Tab drag improperly initialized')
    return
  }

  windowTabs.update((tabs) => {
    if (dragTabIds().length == 0) {
      return tabs
    }

    const headId = dragTabIds()[0]
    const rest = tabs.filter(
      (tab) =>
        dragTabIds().includes(tab.view.windowBrowserId) &&
        tab.view.windowBrowserId != headId,
    )

    // TODO: Drag animations of some sort
    return tabs
      .filter(
        (tab) =>
          !dragTabIds().includes(tab.view.windowBrowserId) ||
          tab.view.windowBrowserId == headId,
      )
      .flatMap((tab) => {
        if (tab.view.windowBrowserId == headId) {
          return [tab, ...rest]
        }

        return tab
      })
  })
}

/**
 * @param {DragEvent} event
 */
function animateTabMove(event) {
  if (!event.dataTransfer) {
    console.warn("Tab drag events didn't have a dataTransfer property")
    return
  }

  if (lastScreenY == event.screenY) {
    return
  }

  /** @type {HTMLButtonElement} */
  const firstDraggingTab = document.getElementById(`tab-${dragTabIds()[0]}`)
  /** @type {HTMLLIElement} */
  const firstPresentation = firstDraggingTab?.parentElement
  const presentationBox = firstPresentation.getBoundingClientRect()

  dragTabsTranslation.set(
    event.screenY - presentationBox.y - startEventRelativeY,
  )

  expectedIndex = Math.floor(event.screenY / presentationBox.height)
  const translateAmount = presentationBox.height * dragTabIds().length

  document
    .querySelectorAll("button[role='tab'][data-dragging='false']")
    .forEach((/** @type {HTMLButtonElement} */ tab) => {
      const index = Number(tab.dataset.index)
      if (index <= expectedIndex && index >= startingIndex) {
        tab.style.transform = `translateY(-${translateAmount}px)`
      } else if (index >= expectedIndex && index <= startingIndex) {
        tab.style.transform = `translateY(${translateAmount}px)`
      } else {
        tab.style.transform = ''
      }
    })
}
