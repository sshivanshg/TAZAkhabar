import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import type { HealthResponse } from '@buildy/shared-types'
import { apiClient } from './src/api/client'

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiClient
      .getHealth()
      .then((result) => {
        if (!cancelled) {
          setHealth(result)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to reach API')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <View style={styles.hero}>
          <Text style={styles.brand} accessibilityRole="header">
            Buildy
          </Text>
          <Text style={styles.headline}>Local news, briefly.</Text>
          <Text style={styles.lede}>
            City-focused summaries you can read and share — built for clarity on a phone
            screen.
          </Text>
        </View>

        <View style={styles.status} accessibilityLiveRegion="polite">
          <Text style={styles.statusLabel}>API status</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {health ? (
            <Text style={styles.statusValue}>
              {health.status ?? 'unknown'} · database {health.database ?? 'unknown'}
            </Text>
          ) : !error ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#1a1a1a" />
              <Text style={styles.statusValue}>Checking…</Text>
            </View>
          ) : null}
        </View>

        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f4ef',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    gap: 12,
  },
  brand: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  lede: {
    fontSize: 18,
    lineHeight: 28,
    color: '#4a453f',
    maxWidth: 420,
  },
  status: {
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(26, 26, 26, 0.15)',
    gap: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusValue: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1a1a1a',
  },
  error: {
    fontSize: 18,
    lineHeight: 28,
    color: '#8b1e1e',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
})
