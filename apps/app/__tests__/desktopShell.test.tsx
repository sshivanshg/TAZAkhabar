import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { AppShell } from '../src/components/desktop/AppShell'

jest.mock('../src/hooks/useBreakpoint', () => ({
  useBreakpoint: jest.fn(),
  isDesktopLayout: (bp: string) => bp === 'desktop' || bp === 'wide',
  isCompactNav: (bp: string) => bp === 'mobile' || bp === 'tablet',
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
  expect(JSON.stringify(toJSON())).not.toContain('Desktop shell')
})

it('passthrough on tablet — no shell chrome', () => {
  useBreakpoint.mockReturnValue('tablet')
  const { toJSON } = render(
    <AppShell sidebar={<Text>Sidebar</Text>}>
      <Text>ChildOnly</Text>
    </AppShell>,
  )
  expect(screen.getByText('ChildOnly')).toBeTruthy()
  expect(screen.queryByText('Sidebar')).toBeNull()
  expect(JSON.stringify(toJSON())).not.toContain('Desktop shell')
})

it('renders sidebar on desktop', () => {
  useBreakpoint.mockReturnValue('desktop')
  render(
    <AppShell sidebar={<Text>Sidebar</Text>}>
      <Text>ChildOnly</Text>
    </AppShell>,
  )
  expect(screen.getByText('Sidebar')).toBeTruthy()
  expect(screen.getByText('ChildOnly')).toBeTruthy()
})

it('renders sidebar on wide', () => {
  useBreakpoint.mockReturnValue('wide')
  render(
    <AppShell sidebar={<Text>Sidebar</Text>}>
      <Text>ChildOnly</Text>
    </AppShell>,
  )
  expect(screen.getByText('Sidebar')).toBeTruthy()
  expect(screen.getByText('ChildOnly')).toBeTruthy()
})
