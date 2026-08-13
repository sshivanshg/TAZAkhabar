import { Redirect, useLocalSearchParams } from 'expo-router'

/** Legacy /feed route — keep for bookmarks; forward into the tab shell. */
export default function FeedRedirect() {
  const params = useLocalSearchParams<{ city?: string; category?: string }>()
  return (
    <Redirect
      href={{
        pathname: '/(tabs)',
        params: {
          ...(params.city ? { city: params.city } : {}),
          ...(params.category ? { category: params.category } : {}),
        },
      }}
    />
  )
}
