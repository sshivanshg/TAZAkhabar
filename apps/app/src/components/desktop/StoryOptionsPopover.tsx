import { useEffect } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type PressableStateCallbackType,
} from 'react-native'
import { MotiView } from 'moti'
import { colors, HIT_TARGET, radius, shadows, space, typography } from '../../theme/tokens'
import { iconStroke } from '../../theme/categoryIcons'
import type { BottomSheetSection } from '../ui/BottomSheet'

export type StoryOptionsAnchor = {
  x: number
  y: number
  width: number
  height: number
}

type Props = {
  visible: boolean
  anchor: StoryOptionsAnchor | null
  title?: string
  sections: BottomSheetSection[]
  onClose: () => void
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

const MENU_WIDTH = 260
const VIEWPORT_PAD = 8
const ANCHOR_GAP = 6
const MOTION_MS = 180
const ROW_HEIGHT = 48

/** Derive an ⋯-aligned rect from a card host measured in the window. */
export function captureMoreButtonAnchor(
  node: View | null,
  onAnchor: (anchor: StoryOptionsAnchor | null) => void,
): void {
  if (node == null || typeof node.measureInWindow !== 'function') {
    onAnchor(null)
    return
  }
  node.measureInWindow((x, y, width, height) => {
    onAnchor({
      x: x + Math.max(0, width - HIT_TARGET),
      y: y + Math.max(0, (height - HIT_TARGET) / 2),
      width: HIT_TARGET,
      height: HIT_TARGET,
    })
  })
}

function menuPosition(
  anchor: StoryOptionsAnchor,
  viewport: { width: number; height: number },
  estimatedHeight: number,
): { top: number; left: number } {
  let left = anchor.x + anchor.width - MENU_WIDTH
  let top = anchor.y + anchor.height + ANCHOR_GAP
  const maxLeft = Math.max(VIEWPORT_PAD, viewport.width - MENU_WIDTH - VIEWPORT_PAD)
  left = Math.min(Math.max(VIEWPORT_PAD, left), maxLeft)
  if (top + estimatedHeight > viewport.height - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, anchor.y - estimatedHeight - ANCHOR_GAP)
  }
  return { top, left }
}

/** Anchored ⋯ menu for desktop story actions — same section shape as the mobile sheet. */
export function StoryOptionsPopover({ visible, anchor, title, sections, onClose }: Props) {
  const viewport = useWindowDimensions()
  const open = visible && anchor != null

  useEffect(() => {
    if (
      !open ||
      typeof window === 'undefined' ||
      typeof window.addEventListener !== 'function'
    ) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', onKeyDown)
      }
    }
  }, [open, onClose])

  const itemCount = sections.reduce((n, section) => n + section.items.length, 0)
  const estimatedHeight =
    (title ? 40 : 8) + itemCount * ROW_HEIGHT + Math.max(0, sections.length - 1) * 8
  const pos = anchor ? menuPosition(anchor, viewport, estimatedHeight) : null

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root} pointerEvents="box-none">
        <Pressable
          focusable={false}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss story options"
        />
        {pos ? (
          <MotiView
            from={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: MOTION_MS }}
            style={[
              styles.menu,
              { top: pos.top, left: pos.left },
              Platform.OS === 'web' ? webMenuOrigin : null,
            ]}
          >
            {title ? (
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {sections.map((section, sectionIndex) => (
              <View key={section.key}>
                {sectionIndex > 0 ? <View style={styles.sectionDivider} /> : null}
                {section.items.map((item) => {
                  const Icon = item.Icon
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        onClose()
                        requestAnimationFrame(() => item.onPress())
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      style={(state) => {
                        const { pressed, hovered, focused } = state as WebPressableState
                        return [
                          styles.row,
                          item.destructive ? styles.rowDanger : null,
                          hovered && !item.destructive ? styles.rowHover : null,
                          pressed
                            ? item.destructive
                              ? styles.rowDangerPressed
                              : styles.rowPressed
                            : null,
                          focused ? styles.rowFocus : null,
                        ]
                      }}
                    >
                      {Icon ? (
                        <Icon
                          size={18}
                          strokeWidth={iconStroke}
                          color={item.destructive ? colors.destructive : colors.textSecondary}
                          style={styles.rowIcon}
                        />
                      ) : (
                        <View style={styles.rowIconSpacer} />
                      )}
                      <Text
                        style={[
                          styles.rowLabel,
                          item.destructive ? styles.rowLabelDanger : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ))}
          </MotiView>
        ) : null}
      </View>
    </Modal>
  )
}

const webMenuOrigin = { transformOrigin: 'top right' } as const

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingVertical: space.xxs,
    ...shadows.card,
  },
  title: {
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: typography.label.letterSpacing,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: space.xxs,
    marginHorizontal: space.md,
  },
  row: {
    minHeight: ROW_HEIGHT,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  rowDanger: {
    backgroundColor: colors.destructiveSoft,
    marginHorizontal: space.xs,
    borderRadius: radius.sm,
  },
  rowHover: {
    backgroundColor: colors.accentSoft,
  },
  rowPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  rowDangerPressed: {
    opacity: 0.88,
  },
  rowFocus: {
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'solid' as const,
          outlineWidth: 2,
          outlineColor: colors.accent,
          outlineOffset: -2,
        }
      : {
          borderWidth: 2,
          borderColor: colors.accent,
        }),
  },
  rowIcon: {
    marginRight: 0,
  },
  rowIconSpacer: {
    width: 18,
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.summary.fontSize,
    lineHeight: typography.summary.lineHeight,
    fontWeight: '500',
    color: colors.text,
  },
  rowLabelDanger: {
    color: colors.destructive,
  },
})
