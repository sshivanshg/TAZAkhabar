import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { colors, radius, space } from '../theme/tokens'

export type ActionSheetItem = {
  key: string
  label: string
  onPress: () => void
  destructive?: boolean
}

type Props = {
  visible: boolean
  title?: string
  items: ActionSheetItem[]
  onClose: () => void
}

/** Bottom action sheet — light surface, Moti fade + slide. */
export function ActionSheet({ visible, title, items, onClose }: Props) {
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
          style={styles.sheet}
        >
          {title ? (
            <Text
              fontSize={13}
              lineHeight={18}
              letterSpacing={0.6}
              fontWeight="$medium"
              color={colors.textMuted}
              textTransform="uppercase"
              px="$4"
              pt="$4"
              pb="$2"
            >
              {title}
            </Text>
          ) : null}
          <VStack>
            {items.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  onClose()
                  // Defer so the sheet can start closing first
                  requestAnimationFrame(() => item.onPress())
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 ? styles.rowBorder : null,
                  pressed ? styles.rowPressed : null,
                ]}
              >
                <Text
                  fontSize={17}
                  lineHeight={24}
                  fontWeight="$medium"
                  color={item.destructive ? colors.textSecondary : colors.text}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </VStack>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={({ pressed }) => [styles.cancel, pressed ? styles.rowPressed : null]}
          >
            <Text fontSize={17} lineHeight={24} fontWeight="$semibold" color={colors.text}>
              Cancel
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    marginHorizontal: space.sm,
    marginBottom: 28,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    paddingHorizontal: space.md + 2,
    justifyContent: 'center',
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  cancel: {
    minHeight: 52,
    marginTop: 8,
    marginHorizontal: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
})
