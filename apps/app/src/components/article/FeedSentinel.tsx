import { useEffect, useRef } from 'react'
import { Platform, View } from 'react-native'

type Props = {
  disabled?: boolean
  onVisible: () => void
}

/** Bottom sentinel — IntersectionObserver on web, layout fallback on native. */
export function FeedSentinel({ disabled, onVisible }: Props) {
  const ref = useRef<View>(null)
  const onVisibleRef = useRef(onVisible)
  onVisibleRef.current = onVisible

  useEffect(() => {
    if (disabled) {
      return
    }
    if (Platform.OS !== 'web' || typeof IntersectionObserver === 'undefined') {
      return
    }
    const node = ref.current as unknown as Element | null
    if (!node) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisibleRef.current()
        }
      },
      { rootMargin: '480px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [disabled])

  return (
    <View
      ref={ref}
      testID="feed-sentinel"
      collapsable={false}
      style={{ height: 1 }}
      accessibilityElementsHidden
    />
  )
}
