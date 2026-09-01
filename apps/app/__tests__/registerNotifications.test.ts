/**
 * @jest-environment jsdom
 */
jest.mock('expo-constants', () => ({
  easConfig: { projectId: 'project-123' },
  expoConfig: { extra: { eas: { projectId: 'project-123' } } },
}))

jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(async () => undefined),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
}))

jest.mock('../src/api/client', () => ({
  apiClient: {
    upsertNotificationSubscription: jest.fn(),
  },
}))

jest.mock('../src/storage/notificationPreferences', () => ({
  getNotificationPlatform: jest.fn(() => 'web'),
  getOrCreateNotificationClientId: jest.fn(async () => 'client-123'),
  setNotificationPromptState: jest.fn(async () => undefined),
}))

import * as Notifications from 'expo-notifications'
import { apiClient } from '../src/api/client'
import { registerNewsNotifications } from '../src/notifications/registerNotifications'
import { setNotificationPromptState } from '../src/storage/notificationPreferences'

describe('registerNewsNotifications', () => {
  const publicKey = Buffer.alloc(65, 1).toString('base64url')
  const registration = {
    pushManager: {
      getSubscription: jest.fn(async () => null),
      subscribe: jest.fn(async () => ({
        endpoint: 'https://push.example/subscription',
        expirationTime: null,
        toJSON: () => ({ keys: { p256dh: 'p256dh', auth: 'auth' } }),
      })),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true })
    ;(Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'expo-token-1' })
    ;(apiClient.upsertNotificationSubscription as jest.Mock).mockRejectedValue(
      new Error('sync failed'),
    )
    process.env.EXPO_PUBLIC_WEB_PUSH_PUBLIC_KEY = publicKey

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: jest.fn(async () => 'granted'),
      },
    })
    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: function PushManager() {},
    })

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: jest.fn(async () => registration),
        ready: Promise.resolve(registration),
      },
    })
  })

  it('does not persist granted state when subscription sync fails', async () => {
    await expect(registerNewsNotifications('jhansi')).rejects.toThrow('sync failed')

    expect(setNotificationPromptState).not.toHaveBeenCalled()
  })
})
