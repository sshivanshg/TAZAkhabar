import { type ComponentType, useMemo } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../../theme/tokens'
import { iconStroke } from '../../theme/categoryIcons'

type IconProps = { size?: number; strokeWidth?: number; color?: string; style?: object }

export type BottomSheetItem = {
  key: string
  label: string
  onPress: () => void
  destructive?: boolean
  detail?: string
  Icon?: ComponentType<IconProps>
}

export type BottomSheetSection = {
  key: string
  items: BottomSheetItem[]
}

type Props = {
  visible: boolean
  title?: string
  /** Grouped rows — dividers only between sections, not every row. */
  sections?: BottomSheetSection[]
  /** Flat list fallback (single implicit section). */
  items?: BottomSheetItem[]
  onClose: () => void
  cancelLabel?: string
  showCancel?: boolean
}

/** Full-bleed overflow sheet — large top radius, icon rows, scrim dismiss. */
export function BottomSheet({
  visible,
  title,
  sections,
  items,
  onClose,
  cancelLabel = 'Cancel',
  showCancel = false,
}: Props) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const resolvedSections: BottomSheetSection[] =
    sections ??
    (items && items.length > 0 ? [{ key: 'default', items }] : [])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss actions"
        >
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ type: 'timing', duration: 220 }}
            style={styles.overlay}
          />
        </Pressable>

        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: visible ? 1 : 0, translateY: visible ? 0 : 40 }}
          transition={{ type: 'timing', duration: 280 }}
          style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, space.md) }]}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} accessibilityElementsHidden />
            {title ? (
              <Text
                fontSize={typography.headlineSm.fontSize}
                lineHeight={typography.headlineSm.lineHeight}
                fontWeight="$semibold"
                color={colors.textSecondary}
                style={styles.title}
              >
                {title}
              </Text>
            ) : null}

            {resolvedSections.map((section, sectionIndex) => (
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
                      accessibilityLabel={
                        item.detail ? `${item.label}. ${item.detail}` : item.label
                      }
                      style={({ pressed }) => [
                        styles.row,
                        item.destructive ? styles.rowDanger : null,
                        pressed
                          ? item.destructive
                            ? styles.rowDangerPressed
                            : styles.rowPressed
                          : null,
                      ]}
                    >
                      {Icon ? (
                        <Icon
                          size={22}
                          strokeWidth={iconStroke}
                          color={item.destructive ? colors.destructive : colors.text}
                          style={styles.rowIcon}
                        />
                      ) : (
                        <View style={styles.rowIconSpacer} />
                      )}
                      <View style={styles.rowCopy}>
                        <Text
                          fontSize={typography.summary.fontSize}
                          lineHeight={typography.summary.lineHeight}
                          fontWeight="$medium"
                          color={item.destructive ? colors.destructive : colors.text}
                          style={styles.rowLabel}
                        >
                          {item.label}
                        </Text>
                        {item.detail ? (
                          <Text
                            fontSize={typography.label.fontSize}
                            lineHeight={typography.label.lineHeight}
                            color={colors.textMuted}
                          >
                            {item.detail}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            ))}
          </View>

          {showCancel ? (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              style={({ pressed }) => [styles.cancel, pressed ? styles.cancelPressed : null]}
            >
              <Text
                fontSize={typography.button.fontSize}
                lineHeight={typography.button.lineHeight}
                fontWeight="$semibold"
                color={colors.text}
              >
                {cancelLabel}
              </Text>
            </Pressable>
          ) : null}
        </MotiView>
      </View>
    </Modal>
  )
}

/** @deprecated Prefer BottomSheet — alias kept for call sites mid-migration. */
export type ActionSheetItem = BottomSheetItem

export function ActionSheet(props: {
  visible: boolean
  title?: string
  items: BottomSheetItem[]
  sections?: BottomSheetSection[]
  onClose: () => void
}) {
  return <BottomSheet showCancel {...props} />
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
      pointerEvents: 'box-none',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    sheetWrap: {
      paddingHorizontal: 0,
      gap: space.xs,
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      overflow: 'hidden',
      paddingBottom: space.sm,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: c.borderSolid,
      marginTop: space.sm,
      marginBottom: space.xs,
    },
    title: {
      paddingHorizontal: space.lg,
      paddingBottom: space.sm,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginVertical: space.xxs,
      marginHorizontal: space.lg,
    },
    row: {
      minHeight: 52,
      paddingHorizontal: space.lg,
      paddingVertical: space.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
    },
    rowDanger: {
      backgroundColor: 'transparent',
    },
    rowPressed: {
      backgroundColor: c.surfaceRaised,
    },
    rowDangerPressed: {
      backgroundColor: c.destructiveSoft,
    },
    rowIcon: {
      marginRight: 0,
    },
    rowIconSpacer: {
      width: 22,
    },
    rowCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    rowLabel: {
      flexShrink: 1,
    },
    cancel: {
      minHeight: HIT_TARGET,
      marginHorizontal: space.sm,
      borderRadius: radius.full,
      backgroundColor: c.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.md,
    },
    cancelPressed: {
      opacity: 0.85,
    },
  })
}
