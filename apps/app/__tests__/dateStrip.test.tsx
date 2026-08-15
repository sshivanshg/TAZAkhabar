import { fireEvent, render, screen } from '@testing-library/react-native'
import { DateStrip } from '../src/components/DateStrip'

jest.mock('moti', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    MotiView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  }
})

jest.mock('@gluestack-ui/themed', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Text, props, children),
  }
})

jest.mock('../src/utils/cityCalendar', () => ({
  todayCityIso: () => '2026-08-15',
  shiftIsoDate: (iso: string, days: number) => {
    const date = new Date(`${iso}T00:00:00.000Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
  },
  formatDateStripLabel: (iso: string, today: string) => (iso === today ? 'Today' : iso),
  formatPickerDateLabel: (iso: string) => iso,
}))

describe('DateStrip', () => {
  it('selects a visible edition date', () => {
    const onSelectDate = jest.fn()
    render(
      <DateStrip
        selectedDate="2026-08-15"
        availableDates={['2026-08-15', '2026-08-14']}
        onSelectDate={onSelectDate}
      />,
    )

    fireEvent.press(screen.getByLabelText('Edition 2026-08-14'))

    expect(onSelectDate).toHaveBeenCalledWith('2026-08-14')
  })

  it('opens the picker and chooses an older available date', () => {
    const onSelectDate = jest.fn()
    render(
      <DateStrip
        selectedDate="2026-08-15"
        availableDates={['2026-08-15', '2026-08-07']}
        onSelectDate={onSelectDate}
      />,
    )

    fireEvent.press(screen.getByLabelText('More dates'))
    expect(screen.getByLabelText('Dismiss date picker')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Choose 2026-08-07'))

    expect(onSelectDate).toHaveBeenCalledWith('2026-08-07')
    expect(screen.queryByLabelText('Dismiss date picker')).toBeNull()
  })
})
