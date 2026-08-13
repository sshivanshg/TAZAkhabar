import { type ComponentType, type ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { colors, HIT_TARGET, radius, space, typography } from '../../theme/tokens'
import { iconStroke } from '../../theme/categoryIcons'

type IconProps = { size?: number; strokeWidth?: number; color?: string; style?: object }

export type BottomSheetItem = {
  key: string
  label: string
  onPress: () => void
  destructive?: boolean
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
}

/** Branded bottom sheet shell — drag handle, grouped actions, detached cancel. */
export function BottomSheet({
  visible,
  title,
  sections,
  items,
  onClose,
  cancelLabel = 'Cancel',
}: Props) {
  const insets = useSafeAreaInsets()
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
            transition={{ type: 'timing', duration: 200 }}
            style={styles.overlay}
          />
        </Pressable>

        <MotiView
          from={{ opacity: 0, translateY: 28 }}
          animate={{ opacity: visible ? 1 : 0, translateY: visible ? 0 : 28 }}
          transition={{ type: 'timing', duration: 220 }}
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
                      accessibilityLabel={item.label}
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
                          size={18}
                          strokeWidth={iconStroke}
                          color={item.destructive ? colors.destructive : colors.textSecondary}
                          style={styles.rowIcon}
                        />
                      ) : (
                        <View style={styles.rowIconSpacer} />
                      )}
                      <Text
                        fontSize={typography.summary.fontSize}
                        lineHeight={typography.summary.lineHeight}
                        fontWeight="$medium"
                        color={item.destructive ? colors.destructive : colors.text}
                        style={styles.rowLabel}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ))}
          </View>

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
  return <BottomSheet {...props} />
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheetWrap: {
    paddingHorizontal: space.sm,
    gap: space.xs,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    paddingBottom: space.xs,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: space.sm,
    marginBottom: space.xs,
  },
  title: {
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: space.xxs,
    marginHorizontal: space.md,
  },
  row: {
    minHeight: 48,
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
  rowPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  rowDangerPressed: {
    opacity: 0.88,
  },
  rowIcon: {
    marginRight: 0,
  },
  rowIconSpacer: {
    width: 18,
  },
  rowLabel: {
    flex: 1,
  },
  cancel: {
    minHeight: HIT_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  cancelPressed: {
    opacity: 0.85,
  },
})
