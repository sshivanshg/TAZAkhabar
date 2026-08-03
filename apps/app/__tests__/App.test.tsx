import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock'
import App from '../App'
import { apiClient } from '../src/api/client'

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext)

jest.mock('../src/api/client', () => ({
  apiClient: {
    getHealth: jest.fn(),
  },
}))

describe('App', () => {
  beforeEach(() => {
    jest.mocked(apiClient.getHealth).mockReset()
  })

  it('renders the brand and shows healthy API status', async () => {
    jest.mocked(apiClient.getHealth).mockResolvedValue({
      status: 'healthy',
      service: 'buildy-api',
      timestampUtc: new Date().toISOString(),
      database: 'up',
    })

    render(<App />)

    expect(await screen.findByText('Buildy')).toBeTruthy()

    await waitFor(() => {
      expect(screen.getByText(/healthy · database up/i)).toBeTruthy()
    })
  })
})
