import {
  formatDateStripLabel,
  shiftIsoDate,
  todayCityIso,
} from '../src/utils/cityCalendar'

describe('cityCalendar', () => {
  it('shifts ISO dates by calendar days', () => {
    expect(shiftIsoDate('2026-08-14', -1)).toBe('2026-08-13')
    expect(shiftIsoDate('2026-08-01', -1)).toBe('2026-07-31')
  })

  it('labels today and yesterday', () => {
    const today = todayCityIso()
    expect(formatDateStripLabel(today, today)).toBe('Today')
    expect(formatDateStripLabel(shiftIsoDate(today, -1), today)).toBe('Yesterday')
  })
})
