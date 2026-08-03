import { StyleSheet } from 'react-native'
import { Box, Pressable, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { CityResponse } from '@newsfeed/shared-types'
import { colors, radius } from '../theme/tokens'

type Props = {
  city: CityResponse
  index: number
  onSelect: (city: CityResponse) => void
}

export function CityRow({ city, index, onSelect }: Props) {
  const name = city.name ?? 'Unknown city'
  const state = city.state ?? ''

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: Math.min(index * 40, 200) }}
    >
      <Pressable
        onPress={() => onSelect(city)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${name}, ${state}`}
        minHeight={56}
        px="$4"
        py="$4"
        borderBottomWidth={StyleSheet.hairlineWidth}
        borderColor={colors.border}
        bg={colors.background}
        $pressed={{ bg: colors.surface }}
      >
        <VStack space="xs">
          <Text fontSize={20} lineHeight={28} fontWeight="$bold" color={colors.text}>
            {name}
          </Text>
          <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
            {state}
          </Text>
        </VStack>
      </Pressable>
    </MotiView>
  )
}

export function CityListSkeleton() {
  return (
    <VStack>
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          minHeight={56}
          px="$4"
          py="$4"
          borderBottomWidth={StyleSheet.hairlineWidth}
          borderColor={colors.border}
          bg={colors.background}
        >
          <Box h={20} w="40%" bg={colors.skeleton} mb="$2" borderRadius={radius.xs} />
          <Box h={16} w="55%" bg={colors.skeleton} borderRadius={radius.xs} />
        </Box>
      ))}
    </VStack>
  )
}
