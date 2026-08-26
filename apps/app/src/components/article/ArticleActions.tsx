import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Bookmark from 'lucide-react-native/icons/bookmark'
import BookmarkCheck from 'lucide-react-native/icons/bookmark-check'
import ExternalLink from 'lucide-react-native/icons/external-link'
import Share2 from 'lucide-react-native/icons/share-2'
import { HIT_TARGET } from '../../theme/tokens'
import { iconStroke } from '../../theme/categoryIcons'
import { readerColors } from '../../theme/readerTokens'
import { pressableState, webFocusRing } from './focusStyle'

export type ArticleActionsVariant = 'inline' | 'bar'

type Props = {
  variant?: ArticleActionsVariant
  bookmarked: boolean
  hasSource: boolean
  onShare: () => void
  onSave: () => void
  onReadSource?: () => void
}

type ActionProps = {
  label: string
  accessibilityLabel: string
  onPress?: () => void
  disabled?: boolean
  children: ReactNode
  variant: ArticleActionsVariant
}

function ActionButton({
  label,
  accessibilityLabel,
  onPress,
  disabled,
  children,
  variant,
}: ActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled || !onPress}
      style={(state) => {
        const { pressed, focused } = pressableState(state)
        return [
          variant === 'bar' ? styles.barBtn : styles.inlineBtn,
          pressed && !disabled ? styles.pressed : null,
          disabled ? styles.disabled : null,
          webFocusRing(Boolean(focused)),
        ]
      }}
    >
      {children}
      <Text style={[styles.label, variant === 'bar' ? styles.barLabel : null]}>{label}</Text>
    </Pressable>
  )
}

function ArticleActionsBase({
  variant = 'inline',
  bookmarked,
  hasSource,
  onShare,
  onSave,
  onReadSource,
}: Props) {
  const SaveIcon = bookmarked ? BookmarkCheck : Bookmark

  return (
    <View
      style={variant === 'bar' ? styles.barRow : styles.inlineRow}
      accessibilityRole="toolbar"
    >
      <ActionButton
        variant={variant}
        label="Share"
        accessibilityLabel="Share"
        onPress={onShare}
      >
        <Share2 size={18} strokeWidth={iconStroke} color={readerColors.text} />
      </ActionButton>
      <ActionButton
        variant={variant}
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
      <ActionButton
        variant={variant}
        label="Read Source"
        accessibilityLabel="Read original article"
        onPress={hasSource ? onReadSource : undefined}
        disabled={!hasSource}
      >
        <ExternalLink
          size={18}
          strokeWidth={iconStroke}
          color={hasSource ? readerColors.text : readerColors.textMuted}
        />
      </ActionButton>
    </View>
  )
}

export const ArticleActions = memo(ArticleActionsBase)

const styles = StyleSheet.create({
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
  },
  inlineBtn: {
    flex: 1,
    minHeight: HIT_TARGET,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: readerColors.sheetBorder,
    backgroundColor: readerColors.sheet,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  barBtn: {
    flex: 1,
    minHeight: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  label: {
    color: readerColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: readerColors.textSecondary,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
})
