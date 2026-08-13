import { cleanup, fireEvent, render, screen } from '@testing-library/react-native'
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
})
