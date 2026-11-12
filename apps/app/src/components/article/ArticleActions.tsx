import { memo, useMemo, type ReactNode } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Bookmark from 'lucide-react-native/icons/bookmark'
import BookmarkCheck from 'lucide-react-native/icons/bookmark-check'
import ChevronLeft from 'lucide-react-native/icons/chevron-left'
import MessageCircle from 'lucide-react-native/icons/message-circle'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { HIT_TARGET } from '../../theme/tokens'
import { iconStroke } from '../../theme/categoryIcons'
import type { ReaderColors } from '../../theme/readerTokens'
import { pressableState, webFocusRing } from './focusStyle'
import { ARTICLE_COPY } from './copy'

type Props = {
  bookmarked: boolean
  onShare: () => void
  onSave: () => void
  /** "Back to news" — shown in the thumb zone when provided. */
  onBack?: () => void
  /** Article reading-language switch, rendered between Back and Save. */
  languageSlot?: ReactNode
}

type ActionProps = {
  label: string
  accessibilityLabel: string
  onPress: () => void
  primary?: boolean
  size?: 'wide' | 'narrow'
  testID?: string
  selected?: boolean
  children: ReactNode
}

function ActionButton({
  label,
  accessibilityLabel,
  onPress,
  primary = false,
  size,
  testID,
  selected,
  children,
}: ActionProps) {
  const { readerColors } = useTheme()
  const styles = useMemo(() => createStyles(readerColors), [readerColors])

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      hitSlop={4}
      style={(state) => {
        const { pressed, focused } = pressableState(state)
        return [
          styles.btn,
          size === 'wide' ? styles.btnWide : size === 'narrow' ? styles.btnNarrow : null,
          primary ? styles.btnPrimary : null,
          pressed ? styles.pressed : null,
          webFocusRing(Boolean(focused), readerColors),
        ]
      }}
    >
      {children}
      <Text
        style={[styles.label, primary ? styles.labelPrimary : null]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function ArticleActionsBase({ bookmarked, onShare, onSave, onBack, languageSlot }: Props) {
  const { readerColors } = useTheme()
  const styles = useMemo(() => createStyles(readerColors), [readerColors])
  const SaveIcon = bookmarked ? BookmarkCheck : Bookmark

  return (
    <View style={styles.row} accessibilityRole="toolbar">
      {onBack ? (
        <ActionButton
          testID="bottom-back"
          size="wide"
          label={ARTICLE_COPY.backToNews}
          accessibilityLabel={ARTICLE_COPY.backToNews}
          onPress={onBack}
        >
          <ChevronLeft size={18} strokeWidth={iconStroke} color={readerColors.text} />
        </ActionButton>
      ) : null}
      {languageSlot ? <View style={styles.langSlot}>{languageSlot}</View> : null}
      <ActionButton
        label={bookmarked ? ARTICLE_COPY.saved : ARTICLE_COPY.save}
        accessibilityLabel={bookmarked ? ARTICLE_COPY.removeBookmark : ARTICLE_COPY.save}
        selected={bookmarked}
        size={onBack ? 'narrow' : undefined}
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
        testID="bottom-whatsapp"
        primary
        label={ARTICLE_COPY.whatsapp}
        accessibilityLabel={ARTICLE_COPY.shareOnWhatsApp}
        onPress={onShare}
      >
        <MessageCircle size={18} strokeWidth={iconStroke} color={readerColors.accent} />
      </ActionButton>
    </View>
  )
}

export const ArticleActions = memo(ArticleActionsBase)

function createStyles(c: ReaderColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      gap: 6,
      paddingVertical: 4,
      backgroundColor: c.headerSolid,
    },
    btn: {
      flex: 1,
      minHeight: HIT_TARGET + 4,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: HIT_TARGET,
      gap: 2,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: 14,
      backgroundColor: c.sheet,
    },
    // Widths tuned so the 4-control row fits 360px: Back gets the most room for its label.
    btnWide: {
      flex: 1.25,
    },
    btnNarrow: {
      flex: 0.85,
    },
    btnPrimary: {
      flex: 1.15,
      backgroundColor: c.accentSoft,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
    },
    labelPrimary: {
      color: c.accent,
      fontWeight: '700',
    },
    langSlot: {
      justifyContent: 'center',
      flexShrink: 0,
    },
    pressed: {
      opacity: 0.78,
      transform: [{ scale: 0.985 }],
    },
  })
}
