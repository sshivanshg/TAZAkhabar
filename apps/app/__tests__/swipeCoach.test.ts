import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  hasCompletedSwipeCoach,
  markSwipeCoachCompleted,
} from '../src/storage/swipeCoach'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}))

const mockGetItem = AsyncStorage.getItem as jest.Mock
const mockSetItem = AsyncStorage.setItem as jest.Mock

describe('swipeCoach', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns false when nothing stored', async () => {
    mockGetItem.mockResolvedValueOnce(null)
    await expect(hasCompletedSwipeCoach()).resolves.toBe(false)
    expect(mockGetItem).toHaveBeenCalledWith('newsfeed.swipeCoach.v1')
  })

  it('returns true when flag is set', async () => {
    mockGetItem.mockResolvedValueOnce('1')
    await expect(hasCompletedSwipeCoach()).resolves.toBe(true)
  })

  it('persists completion flag', async () => {
    mockSetItem.mockResolvedValueOnce(undefined)
    await markSwipeCoachCompleted()
    expect(mockSetItem).toHaveBeenCalledWith('newsfeed.swipeCoach.v1', '1')
  })

  it('treats storage errors as incomplete coach', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('unavailable'))
    await expect(hasCompletedSwipeCoach()).resolves.toBe(false)
  })
})
