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
  type NotificationPromptState,
} from '../storage/notificationPreferences'

export type RegisterNotificationsResult =
  | { status: 'granted'; platform: 'native' | 'web' }
  | { status: 'denied'; platform: 'native' | 'web' }
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

async function registerNativeNotifications(citySlug: string, preferredLanguage?: string | null) {
  const permission = await Notifications.requestPermissionsAsync()
  if (!permission.granted) {
    return { status: 'denied' as const, platform: 'native' as const }
  }

  const projectId = getExpoProjectId()
  if (!projectId) {
    return {
      status: 'unsupported' as const,
      platform: 'native' as const,
      reason: 'Expo project id is missing.',
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
  const subscription = await apiClient.upsertNotificationSubscription(payload)
  await setNotificationPromptState({
    status: 'granted',
    lastPromptAt: new Date().toISOString(),
    lastDismissedAt: null,
  })
  return { status: 'granted' as const, platform: 'native' as const, subscription }
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

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { status: 'denied' as const, platform: 'web' as const }
  }

  const publicKey = process.env.EXPO_PUBLIC_WEB_PUSH_PUBLIC_KEY
  if (!publicKey) {
    return {
      status: 'unsupported' as const,
      platform: 'web' as const,
      reason: 'Web push public key is missing.',
    }
  }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const applicationServerKey = base64UrlToUint8Array(publicKey)
  const applicationServerKeyBuffer = applicationServerKey.buffer.slice(
    applicationServerKey.byteOffset,
    applicationServerKey.byteOffset + applicationServerKey.byteLength,
  ) as ArrayBuffer
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
  await apiClient.upsertNotificationSubscription(payload)
  await setNotificationPromptState({
    status: 'granted',
    lastPromptAt: new Date().toISOString(),
    lastDismissedAt: null,
  })
  return { status: 'granted' as const, platform: 'web' as const, subscription }
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
