import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Bookmark from 'lucide-react-native/icons/bookmark'
import BookmarkCheck from 'lucide-react-native/icons/bookmark-check'
import Share2 from 'lucide-react-native/icons/share-2'
import { HIT_TARGET } from '../../theme/tokens'
import { iconStroke } from '../../theme/categoryIcons'
import { readerColors } from '../../theme/readerTokens'
import { pressableState, webFocusRing } from './focusStyle'

type Props = {
  bookmarked: boolean
  onShare: () => void
  onSave: () => void
}

type ActionProps = {
  label: string
  accessibilityLabel: string
  onPress: () => void
  children: ReactNode
}

function ActionButton({
  label,
  accessibilityLabel,
  onPress,
  children,
}: ActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={(state) => {
        const { pressed, focused } = pressableState(state)
        return [styles.btn, pressed ? styles.pressed : null, webFocusRing(Boolean(focused))]
      }}
    >
      {children}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

function ArticleActionsBase({ bookmarked, onShare, onSave }: Props) {
  const SaveIcon = bookmarked ? BookmarkCheck : Bookmark

  return (
    <View style={styles.row} accessibilityRole="toolbar">
      <ActionButton label="Share" accessibilityLabel="Share" onPress={onShare}>
        <Share2 size={18} strokeWidth={iconStroke} color={readerColors.text} />
      </ActionButton>
      <ActionButton
        label={bookmarked ? 'Saved' : 'Save'}
        accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Save'}
        onPress={onSave}
      >
        <SaveIcon
          size={18}
          strokeWidth={iconStroke}
          color={bookmarked ? readerColors.accent : readerColors.text}
          fill={bookmarked ? readerColors.accent : 'none'}
        />
      </ActionButton>
    </View>
  )
}

export const ArticleActions = memo(ArticleActionsBase)

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
  },
  btn: {
    flex: 1,
    minHeight: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: readerColors.textSecondary,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
})
