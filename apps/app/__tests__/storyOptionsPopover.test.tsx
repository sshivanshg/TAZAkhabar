import { cleanup, fireEvent, render, screen } from '@testing-library/react-native'
import { Platform } from 'react-native'
import type { BottomSheetSection } from '../src/components/ui/BottomSheet'
import { StoryOptionsPopover } from '../src/components/desktop/StoryOptionsPopover'

jest.mock('moti', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    MotiView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  }
})

function makeSections(actions: jest.Mock[] = [jest.fn()]): BottomSheetSection[] {
  return [
    {
      key: 'share',
      items: [
        { key: 'share', label: 'Share', onPress: actions[0] ?? jest.fn() },
        { key: 'save', label: 'Save', onPress: actions[1] ?? jest.fn() },
      ],
    },
    {
      key: 'danger',
      items: [
        {
          key: 'block',
          label: 'Block this source',
          destructive: true,
          onPress: actions[2] ?? jest.fn(),
        },
      ],
    },
  ]
}

const sections: BottomSheetSection[] = [
  {
    key: 'share',
    items: [{ key: 'share', label: 'Share', onPress: jest.fn() }],
  },
]

const anchor = { x: 400, y: 80, width: 44, height: 44 }

type Listener = EventListenerOrEventListenerObject

function installWindowKeyEvents() {
  const listeners = new Map<string, Set<Listener>>()
  const win = window as Window & typeof globalThis
  const originalAdd = win.addEventListener
  const originalRemove = win.removeEventListener
  const originalDispatch = win.dispatchEvent

  win.addEventListener = ((type: string, listener: Listener) => {
    if (!listeners.has(type)) {
      listeners.set(type, new Set())
    }
    listeners.get(type)!.add(listener)
  }) as typeof window.addEventListener

  win.removeEventListener = ((type: string, listener: Listener) => {
    listeners.get(type)?.delete(listener)
  }) as typeof window.removeEventListener

  win.dispatchEvent = ((event: Event) => {
    listeners.get(event.type)?.forEach((listener) => {
      if (typeof listener === 'function') {
        listener(event)
      } else {
        listener.handleEvent(event)
      }
    })
    return true
  }) as typeof window.dispatchEvent

  return () => {
    win.addEventListener = originalAdd
    win.removeEventListener = originalRemove
    win.dispatchEvent = originalDispatch
  }
}

function dispatchEscape() {
  const event = new Event('keydown')
  Object.defineProperty(event, 'key', { value: 'Escape' })
  window.dispatchEvent(event)
}

function dispatchTab(shiftKey = false) {
  const event = new Event('keydown')
  const preventDefault = jest.fn()
  Object.defineProperty(event, 'key', { value: 'Tab' })
  Object.defineProperty(event, 'shiftKey', { value: shiftKey })
  Object.defineProperty(event, 'preventDefault', { value: preventDefault })
  window.dispatchEvent(event)
  return preventDefault
}

type FakeFocusable = {
  label: string
  focus: jest.Mock<void, []>
}

function installWebFocusHarness() {
  const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS')
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => 'web',
  })

  const originalDocument = (globalThis as { document?: Document }).document
  const fakeDocument = {
    activeElement: null,
    querySelectorAll: jest.fn(),
  } as unknown as Document
  ;(globalThis as { document?: Document }).document = fakeDocument

  const originalRaf = global.requestAnimationFrame
  const originalCancelRaf = global.cancelAnimationFrame
  global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    callback(0)
    return 1
  }) as typeof requestAnimationFrame
  global.cancelAnimationFrame = jest.fn() as typeof cancelAnimationFrame

  const trigger: FakeFocusable = { label: 'trigger', focus: jest.fn() }
  const items: FakeFocusable[] = ['Share', 'Save', 'Block this source'].map((label) => {
    const item: FakeFocusable = {
      label,
      focus: jest.fn(() => {
        Object.defineProperty(document, 'activeElement', {
          configurable: true,
          value: item,
        })
      }),
    }
    return item
  })

  Object.defineProperty(document, 'activeElement', {
    configurable: true,
    value: trigger,
  })
  document.querySelectorAll = jest.fn(() => items as unknown as NodeListOf<Element>)

  return {
    items,
    trigger,
    restore: () => {
      ;(globalThis as { document?: Document }).document = originalDocument
      global.requestAnimationFrame = originalRaf
      global.cancelAnimationFrame = originalCancelRaf
      if (platformDescriptor) {
        Object.defineProperty(Platform, 'OS', platformDescriptor)
      }
    },
  }
}

describe('StoryOptionsPopover', () => {
  let restoreWindow: () => void

  beforeEach(() => {
    restoreWindow = installWindowKeyEvents()
  })

  afterEach(() => {
    cleanup()
    restoreWindow()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn()
    render(
      <StoryOptionsPopover
        visible
        anchor={anchor}
        sections={sections}
        onClose={onClose}
      />,
    )

    dispatchEscape()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the outside overlay is pressed', () => {
    const onClose = jest.fn()
    render(
      <StoryOptionsPopover
        visible
        anchor={anchor}
        sections={sections}
        onClose={onClose}
      />,
    )

    fireEvent.press(screen.getByLabelText('Dismiss story options'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not render the dismiss overlay until an anchor is set', () => {
    render(
      <StoryOptionsPopover
        visible
        anchor={null}
        sections={sections}
        onClose={jest.fn()}
      />,
    )

    expect(screen.queryByLabelText('Dismiss story options')).toBeNull()
  })

  it('focuses the first action and traps Tab inside the popover', () => {
    const harness = installWebFocusHarness()
    try {
      render(
        <StoryOptionsPopover
          visible
          anchor={anchor}
          sections={makeSections()}
          onClose={jest.fn()}
        />,
      )

      expect(harness.items[0]!.focus).toHaveBeenCalledTimes(1)

      const preventedForward = dispatchTab()
      expect(preventedForward).toHaveBeenCalledTimes(1)
      expect(harness.items[1]!.focus).toHaveBeenCalledTimes(1)

      const preventedBackward = dispatchTab(true)
      expect(preventedBackward).toHaveBeenCalledTimes(1)
      expect(harness.items[0]!.focus).toHaveBeenCalledTimes(2)
    } finally {
      harness.restore()
    }
  })

  it('cycles Shift+Tab from the first action to the last action', () => {
    const harness = installWebFocusHarness()
    try {
      render(
        <StoryOptionsPopover
          visible
          anchor={anchor}
          sections={makeSections()}
          onClose={jest.fn()}
        />,
      )

      dispatchTab(true)

      expect(harness.items[2]!.focus).toHaveBeenCalledTimes(1)
    } finally {
      harness.restore()
    }
  })

  it('returns focus to the trigger on Escape and outside press', () => {
    const harness = installWebFocusHarness()
    try {
      const { rerender } = render(
        <StoryOptionsPopover
          visible
          anchor={anchor}
          sections={makeSections()}
          onClose={jest.fn()}
        />,
      )

      dispatchEscape()
      expect(harness.trigger.focus).toHaveBeenCalledTimes(1)

      harness.trigger.focus.mockClear()
      rerender(
        <StoryOptionsPopover
          visible
          anchor={anchor}
          sections={makeSections()}
          onClose={jest.fn()}
        />,
      )
      fireEvent.press(screen.getByLabelText('Dismiss story options'))

      expect(harness.trigger.focus).toHaveBeenCalledTimes(1)
    } finally {
      harness.restore()
    }
  })

  it('activates a focused action with Enter or Space and returns focus', () => {
    const harness = installWebFocusHarness()
    const share = jest.fn()
    const save = jest.fn()
    try {
      render(
        <StoryOptionsPopover
          visible
          anchor={anchor}
          sections={makeSections([share, save])}
          onClose={jest.fn()}
        />,
      )

      fireEvent(screen.getByLabelText('Share'), 'onKeyDown', {
        nativeEvent: { key: 'Enter', preventDefault: jest.fn() },
      })
      fireEvent(screen.getByLabelText('Save'), 'onKeyDown', {
        nativeEvent: { key: ' ', preventDefault: jest.fn() },
      })

      expect(share).toHaveBeenCalledTimes(1)
      expect(save).toHaveBeenCalledTimes(1)
      expect(harness.trigger.focus).toHaveBeenCalledTimes(2)
    } finally {
      harness.restore()
    }
  })
})
