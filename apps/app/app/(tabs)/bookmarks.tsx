import { StyleSheet, View } from 'react-native'
import { Text, VStack } from '@gluestack-ui/themed'
import { Bookmark } from 'lucide-react-native'
import { MotiView } from 'moti'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import { colors, radius } from '../../src/theme/tokens'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { iconStroke } from '../../src/theme/categoryIcons'

/** Bookmarks stub — no accounts yet, so saved stories are not persisted. */
export default function BookmarksScreen() {
  const tabClearance = useTabBarClearance()
  return (
    <TabScreenShell>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 220 }}
        style={[styles.root, { paddingBottom: tabClearance }]}
      >
        <VStack flex={1} px="$6" justifyContent="center" alignItems="center" space="md">
          <View style={styles.iconWrap}>
            <Bookmark size={28} strokeWidth={iconStroke} color={colors.accent} />
          </View>
          <Text fontSize={22} lineHeight={30} fontWeight="$bold" color={colors.text} textAlign="center">
            Bookmarks coming soon
          </Text>
          <Text
            fontSize={16}
            lineHeight={24}
            color={colors.textSecondary}
            textAlign="center"
          >
            Save stories for later once accounts land. For now, browse Home and Discover.
          </Text>
        </VStack>
      </MotiView>
    </TabScreenShell>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
})
