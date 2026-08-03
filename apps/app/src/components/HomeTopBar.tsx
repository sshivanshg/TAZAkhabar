import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bell, Menu, Search } from 'lucide-react-native'
import { colors, radius, space } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'

type Props = {
  onMenuPress: () => void
  onSearchPress: () => void
  onNotificationPress?: () => void
}

/** Home top bar — menu left, search + notification stub right. */
export function HomeTopBar({ onMenuPress, onSearchPress, onNotificationPress }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 4) }]}>
      <Pressable
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        hitSlop={8}
        style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
      >
        <Menu size={24} strokeWidth={iconStroke} color={colors.text} />
      </Pressable>

      <View style={styles.right}>
        <Pressable
          onPress={onSearchPress}
          accessibilityRole="button"
          accessibilityLabel="Search and discover"
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
        >
          <Search size={22} strokeWidth={iconStroke} color={colors.accent} />
        </Pressable>
        <Pressable
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications (coming soon)"
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
        >
          <Bell size={22} strokeWidth={iconStroke} color={colors.text} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    height: undefined,
    minHeight: 48,
    paddingBottom: space.xxs,
    paddingHorizontal: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    flexGrow: 0,
    flexShrink: 0,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
  },
})
