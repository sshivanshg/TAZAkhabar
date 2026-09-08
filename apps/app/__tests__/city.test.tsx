import { render, screen } from '@testing-library/react-native'
import CityRoute from '../app/city'

const mockRedirect = jest.fn()

jest.mock('expo-router', () => ({
  Redirect: (props: { href: unknown }) => {
    mockRedirect(props.href)
    return null
  },
}))

describe('city route', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
  })

  it('redirects to home with city picker open', () => {
    render(<CityRoute />)

    expect(mockRedirect).toHaveBeenCalledWith({
      pathname: '/(tabs)',
      params: { pickCity: '1' },
    })
  })
})
