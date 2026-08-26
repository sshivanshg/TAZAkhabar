import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import Check from 'lucide-react-native/icons/check'
import Circle from 'lucide-react-native/icons/circle'
import type { CityResponse } from '@newsfeed/shared-types'
import { colors, HIT_TARGET, radius, space } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'

type Props = {
  city: CityResponse
  selected: boolean
  saving?: boolean
  disabled?: boolean
  /** Extra status line under the state, e.g. "Current city". */
  statusLabel?: string
  onSelect: (city: CityResponse) => void
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

function cityLabel(city: CityResponse): { name: string; state: string } {
  return {
    name: city.name?.trim() || 'Unknown city',
    state: city.state?.trim() || '',
  }
}

/** Tappable city row — whole surface selects, with an explicit selected state. */
export function CityListItem({
  city,
  selected,
  saving = false,
  disabled = false,
  statusLabel,
  onSelect,
}: Props) {
  const { name, state } = cityLabel(city)
  const a11yLabel = [
    name,
    state,
    selected ? 'currently selected' : null,
    saving ? 'setting up your feed' : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Pressable
      onPress={() => onSelect(city)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected, busy: saving, disabled }}
      style={(pressState) => {
        const { pressed, hovered, focused } = pressState as WebPressableState
        return [
          styles.row,
          selected ? styles.rowSelected : null,
          hovered && Platform.OS === 'web' && !pressed ? styles.rowHover : null,
          pressed && !disabled ? styles.rowPressed : null,
          focused ? styles.rowFocused : null,
          disabled && !selected ? styles.rowDisabled : null,
        ]
      }}
    >
      <View style={styles.copy}>
        <Text
          fontSize={18}
          lineHeight={24}
          fontWeight="$semibold"
          color={colors.text}
          numberOfLines={1}
        >
          {name}
        </Text>
        {state ? (
          <Text
            fontSize={15}
            lineHeight={20}
            color={colors.textSecondary}
            numberOfLines={1}
          >
            {state}
          </Text>
        ) : null}
        {statusLabel ? (
          <Text
            fontSize={13}
            lineHeight={18}
            fontWeight="$semibold"
            color={colors.accent}
            mt="$0.5"
          >
            {statusLabel}
          </Text>
        ) : null}
      </View>
      <View style={styles.indicator} accessibilityElementsHidden>
        {saving ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : selected ? (
          <MotiView
            from={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 180 }}
            style={styles.checkWrap}
          >
            <Check size={18} strokeWidth={2.2} color={colors.textOnAccent} />
          </MotiView>
        ) : (
          <Circle size={20} strokeWidth={iconStroke} color={colors.borderSolid} />
        )}
      </View>
    </Pressable>
  )
}

export function CityListSkeleton() {
  return (
    <View style={styles.skeletonBlock} accessibilityLabel="Loading cities">
      <View style={styles.searchSkeleton} />
      <View style={styles.sectionSkeleton} />
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.rowSkeleton}>
          <View style={styles.skeletonCopy}>
            <View style={[styles.bone, styles.boneTitle]} />
            <View style={[styles.bone, styles.boneMeta]} />
          </View>
          <View style={styles.boneDot} />
        </View>
      ))}
    </View>
  )
}

const webPointer: ViewStyle =
  Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : {}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...webPointer,
  },
  rowSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  rowHover: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSolid,
  },
  rowPressed: {
    backgroundColor: colors.surfaceRaised,
    transform: [{ scale: 0.992 }],
    opacity: 0.96,
  },
  rowFocused: {
    borderColor: colors.accent,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  indicator: {
    width: HIT_TARGET,
    minHeight: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonBlock: {
    gap: 10,
  },
  searchSkeleton: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.skeleton,
  },
  sectionSkeleton: {
    height: 16,
    width: 140,
    borderRadius: radius.xs,
    backgroundColor: colors.skeleton,
    marginTop: space.sm,
    marginBottom: 2,
  },
  rowSkeleton: {
    minHeight: 72,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  skeletonCopy: {
    flex: 1,
    gap: 8,
  },
  bone: {
    height: 16,
    borderRadius: radius.xs,
    backgroundColor: colors.skeleton,
  },
  boneTitle: {
    height: 18,
    width: '42%',
  },
  boneMeta: {
    width: '58%',
  },
  boneDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.skeleton,
  },
})
