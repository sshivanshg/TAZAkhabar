import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppShell } from '../src/components/desktop/AppShell'
import { DesktopSidebar } from '../src/components/desktop/DesktopSidebar'

jest.mock('../src/components/BrandHomeButton', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    BrandHomeButton: () => React.createElement(Text, null, 'TazaKhabar'),
  }
})

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: View,
    Circle: View,
    Path: View,
    Rect: View,
  }
})

jest.mock('../src/hooks/useBreakpoint', () => ({
  useBreakpoint: jest.fn(),
  isDesktopLayout: (bp: string) => bp === 'desktop' || bp === 'wide',
  isExpandedLayout: (bp: string) => bp !== 'mobile',
  isCompactNav: (bp: string) => bp === 'mobile',
}))

const mockUsePathname = jest.fn(() => '/')

jest.mock('expo-router', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: jest.fn() }),
  router: { replace: jest.fn() },
}))

const { useBreakpoint } = require('../src/hooks/useBreakpoint')

it('passthrough on mobile — no shell chrome', () => {
  useBreakpoint.mockReturnValue('mobile')
  const { toJSON } = render(
    <AppShell sidebar={<Text>Sidebar</Text>}>
      <Text>ChildOnly</Text>
    </AppShell>,
  )
  expect(screen.getByText('ChildOnly')).toBeTruthy()
  expect(screen.queryByText('Sidebar')).toBeNull()
  // tree root should be the child text node path, not a shell row labeled AppShell
  expect(JSON.stringify(toJSON())).not.toContain('Expanded shell')
})

it('renders expanded shell on tablet', () => {
  useBreakpoint.mockReturnValue('tablet')
  const { toJSON } = render(
    <AppShell sidebar={<Text>Sidebar</Text>}>
      <Text>ChildOnly</Text>
    </AppShell>,
  )
  expect(screen.getByText('ChildOnly')).toBeTruthy()
  expect(screen.queryByText('Sidebar')).toBeNull()
  expect(JSON.stringify(toJSON())).toContain('Expanded shell')
})

it('renders expanded shell on desktop', () => {
  useBreakpoint.mockReturnValue('desktop')
  render(
    <AppShell sidebar={<Text>Sidebar</Text>}>
      <Text>ChildOnly</Text>
    </AppShell>,
  )
  expect(screen.getByText('ChildOnly')).toBeTruthy()
  expect(screen.queryByText('Sidebar')).toBeNull()
  expect(screen.getByLabelText('Expanded shell')).toBeTruthy()
})

it('renders expanded shell on wide', () => {
  useBreakpoint.mockReturnValue('wide')
  render(
    <AppShell sidebar={<Text>Sidebar</Text>}>
      <Text>ChildOnly</Text>
    </AppShell>,
  )
  expect(screen.getByText('ChildOnly')).toBeTruthy()
  expect(screen.queryByText('Sidebar')).toBeNull()
})

function renderSidebar() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1280, height: 800 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <DesktopSidebar />
    </SafeAreaProvider>,
  )
}

it('marks Bookmarks selected and Home not selected when pathname is /bookmarks', () => {
  mockUsePathname.mockReturnValue('/bookmarks')
  renderSidebar()
  expect(screen.getByTestId('sidebar-nav-bookmarks').props.accessibilityState?.selected).toBe(true)
  expect(screen.getByTestId('sidebar-nav-home').props.accessibilityState?.selected).toBe(false)
})

it('shows a static version footer so the sidebar does not trail into empty space', () => {
  mockUsePathname.mockReturnValue('/')
  renderSidebar()
  expect(screen.getByTestId('sidebar-footer')).toBeTruthy()
  expect(screen.getByText('TazaKhabar v0.1')).toBeTruthy()
})
