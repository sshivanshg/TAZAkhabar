import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { apiClient } from '../api/client'
import {
  getNotificationPlatform,
  getNotificationPromptState,
  getOrCreateNotificationClientId,
  setNotificationPromptState,
  type NotificationDeliveryMode,
} from '../storage/notificationPreferences'

export type RegisterNotificationsResult =
  | { status: 'granted'; platform: 'native' | 'web'; synced: boolean; reason?: string }
  | { status: 'denied'; platform: 'native' | 'web'; reason?: string }
  | { status: 'unsupported'; platform: 'native' | 'web'; reason: string }

function getExpoProjectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
  )
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary')
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

function hasMatchingApplicationServerKey(
  subscription: PushSubscription,
  expectedKey: Uint8Array,
): boolean {
  const configuredKey = subscription.options.applicationServerKey
  if (!configuredKey) {
    return true
  }

  const actualKey = new Uint8Array(configuredKey)
  if (actualKey.length !== expectedKey.length) {
    return false
  }

  return actualKey.every((byte, index) => byte === expectedKey[index])
}

async function persistGrantedPromptState() {
  await setNotificationPromptState({
    status: 'granted',
    lastPromptAt: new Date().toISOString(),
    lastDismissedAt: null,
  })
}

async function registerNativeNotifications(citySlug: string, preferredLanguage?: string | null) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Breaking news',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    })
  }

  const projectId = getExpoProjectId()
  if (!projectId) {
    return {
      status: 'unsupported' as const,
      platform: 'native' as const,
      reason: 'Expo project id is missing.',
    }
  }

  const permission = await Notifications.requestPermissionsAsync()
  if (!permission.granted) {
    return {
      status: 'denied' as const,
      platform: 'native' as const,
      reason: 'Notifications are blocked for this app. Allow them in device settings, then try again.',
    }
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId })
  const clientId = await getOrCreateNotificationClientId()
  const payload = {
    clientId,
    platform: 'native' as const,
    city: citySlug,
    deliveryMode: 'breaking' as NotificationDeliveryMode,
    categories: ['Local', 'State', 'National'],
    preferredLanguage: preferredLanguage ?? undefined,
    expoPushToken: token.data,
    webPushSubscription: undefined,
    enabled: true,
  }
  try {
    await apiClient.upsertNotificationSubscription(payload)
    await persistGrantedPromptState()
    return {
      status: 'granted' as const,
      platform: 'native' as const,
      synced: true,
    }
  } catch (error) {
    await persistGrantedPromptState()
    return {
      status: 'granted' as const,
      platform: 'native' as const,
      synced: false,
      reason:
        error instanceof Error
          ? 'Permission was granted, but we could not finish syncing alerts yet. Try again from Profile when your connection is better.'
          : 'Permission was granted, but we could not finish syncing alerts yet. Try again from Profile when your connection is better.',
    }
  }
}

async function registerWebNotifications(citySlug: string, preferredLanguage?: string | null) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return {
      status: 'unsupported' as const,
      platform: 'web' as const,
      reason: 'Browser notifications are unavailable in this environment.',
    }
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      status: 'unsupported' as const,
      platform: 'web' as const,
      reason: 'This browser does not support push notifications.',
    }
  }

  const publicKey = process.env.EXPO_PUBLIC_WEB_PUSH_PUBLIC_KEY
  if (!publicKey) {
    return {
      status: 'unsupported' as const,
      platform: 'web' as const,
      reason: 'Web push public key is missing.',
    }
  }

  const applicationServerKey = base64UrlToUint8Array(publicKey)
  if (applicationServerKey.length !== 65) {
    return {
      status: 'unsupported' as const,
      platform: 'web' as const,
      reason: 'Web push public key is invalid.',
    }
  }

  if (Notification.permission === 'denied') {
    return {
      status: 'denied' as const,
      platform: 'web' as const,
      reason: 'Notifications are blocked for this site. Allow them in browser site settings, then try again.',
    }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return {
      status: 'denied' as const,
      platform: 'web' as const,
      reason: permission === 'denied'
        ? 'Notifications are blocked for this site. Allow them in browser site settings, then try again.'
        : 'Permission was not granted. Tap Enable alerts again when you are ready.',
    }
  }

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  let existing = await registration.pushManager.getSubscription()
  if (existing && !hasMatchingApplicationServerKey(existing, applicationServerKey)) {
    await existing.unsubscribe()
    existing = null
  }

  const applicationServerKeyBuffer = new ArrayBuffer(applicationServerKey.byteLength)
  new Uint8Array(applicationServerKeyBuffer).set(applicationServerKey)
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKeyBuffer,
    }))

  const clientId = await getOrCreateNotificationClientId()
  const subscriptionJson = subscription.toJSON()
  const payload = {
    clientId,
    platform: 'web' as const,
    city: citySlug,
    deliveryMode: 'breaking' as NotificationDeliveryMode,
    categories: ['Local', 'State', 'National'],
    preferredLanguage: preferredLanguage ?? undefined,
    expoPushToken: undefined,
    webPushSubscription: {
      endpoint: subscription.endpoint,
      p256Dh: subscriptionJson.keys?.p256dh ?? '',
      auth: subscriptionJson.keys?.auth ?? '',
      expirationTime: subscription.expirationTime ?? undefined,
    },
    enabled: true,
  }
  try {
    await apiClient.upsertNotificationSubscription(payload)
    await persistGrantedPromptState()
    return {
      status: 'granted' as const,
      platform: 'web' as const,
      synced: true,
    }
  } catch (error) {
    await persistGrantedPromptState()
    return {
      status: 'granted' as const,
      platform: 'web' as const,
      synced: false,
      reason:
        error instanceof Error
          ? 'Permission was granted, but we could not finish syncing alerts yet. Try again from Profile when your connection is better.'
          : 'Permission was granted, but we could not finish syncing alerts yet. Try again from Profile when your connection is better.',
    }
  }
}

export async function registerNewsNotifications(
  citySlug: string,
  preferredLanguage?: string | null,
): Promise<RegisterNotificationsResult> {
  const platform = getNotificationPlatform()
  const result =
    platform === 'web'
      ? await registerWebNotifications(citySlug, preferredLanguage)
      : await registerNativeNotifications(citySlug, preferredLanguage)
  return result
}

export async function suppressNotificationPrompt(status: 'dismissed' | 'denied'): Promise<void> {
  const current = await getNotificationPromptState()
  await setNotificationPromptState({
    status,
    lastPromptAt: new Date().toISOString(),
    lastDismissedAt: status === 'dismissed' ? new Date().toISOString() : current.lastDismissedAt,
  })
}

export async function markNotificationPromptShown(): Promise<void> {
  const current = await getNotificationPromptState()
  await setNotificationPromptState({
    ...current,
    lastPromptAt: new Date().toISOString(),
  })
}
