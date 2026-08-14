import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'newsfeed.swipeCoach.v1'

export async function hasCompletedSwipeCoach(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY)
    return value === '1'
  } catch {
    return false
  }
}

export async function markSwipeCoachCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Coach may show again — acceptable per design.
  }
}
