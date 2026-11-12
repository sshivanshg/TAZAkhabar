import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppShell } from '../src/components/desktop/AppShell'
import { DesktopSidebar } from '../src/components/desktop/DesktopSidebar'

jest.mock('../src/components/BrandHomeButton', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    BrandHomeButton: () => React.createElement(Text, null, 'Khabro'),
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

const safeMetrics = {
  frame: { x: 0, y: 0, width: 1280, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
}

function renderShell() {
  return render(
    <SafeAreaProvider initialMetrics={safeMetrics}>
      <AppShell>
        <Text>ChildOnly</Text>
      </AppShell>
    </SafeAreaProvider>,
  )
}

it('passthrough on mobile — no shell chrome', () => {
  useBreakpoint.mockReturnValue('mobile')
  mockUsePathname.mockReturnValue('/')
  const { toJSON } = renderShell()
  expect(screen.getByText('ChildOnly')).toBeTruthy()
  expect(screen.queryByTestId('desktop-shell-sidebar')).toBeNull()
  expect(JSON.stringify(toJSON())).not.toContain('Expanded shell')
})

it.each(['tablet', 'desktop', 'wide'])('renders the shared sidebar shell on %s', (bp) => {
  useBreakpoint.mockReturnValue(bp)
  mockUsePathname.mockReturnValue('/')
  renderShell()
  expect(screen.getByText('ChildOnly')).toBeTruthy()
  expect(screen.getByLabelText('Expanded shell')).toBeTruthy()
  expect(screen.getByTestId('desktop-shell-sidebar')).toBeTruthy()
})

it.each(['/profile', '/contact', '/article/42'])('keeps the sidebar on %s', (path) => {
  useBreakpoint.mockReturnValue('desktop')
  mockUsePathname.mockReturnValue(path)
  renderShell()
  expect(screen.getByTestId('desktop-shell-sidebar')).toBeTruthy()
})

it('hides the sidebar on the language onboarding route', () => {
  useBreakpoint.mockReturnValue('desktop')
  mockUsePathname.mockReturnValue('/language')
  renderShell()
  expect(screen.queryByTestId('desktop-shell-sidebar')).toBeNull()
  expect(screen.getByText('ChildOnly')).toBeTruthy()
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
  expect(screen.getByText('Khabro v0.1')).toBeTruthy()
})
