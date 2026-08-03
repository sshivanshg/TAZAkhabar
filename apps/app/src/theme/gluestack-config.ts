import { config as defaultConfig } from '@gluestack-ui/config'
import { createConfig } from '@gluestack-ui/themed'

/** Light theme with a single blue accent. */
export const newsfeedConfig = createConfig({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      primary0: '#FFFFFF',
      primary50: '#FAFAFA',
      primary100: '#F0F0F0',
      primary200: '#E8E8E8',
      primary300: '#D6D6D6',
      primary400: '#8A8A8A',
      primary500: '#6B6B6B',
      primary600: '#1D7BFF',
      primary700: '#1563D4',
      primary800: '#1A1A1A',
      primary900: '#1A1A1A',
      primary950: '#0A0A0A',
      backgroundLight0: '#FFFFFF',
      backgroundLight50: '#FAFAFA',
      backgroundLight100: '#F0F0F0',
      backgroundDark900: '#1A1A1A',
      textLight0: '#FFFFFF',
      textLight50: '#FAFAFA',
      textLight400: '#8A8A8A',
      textLight500: '#6B6B6B',
      textLight700: '#1A1A1A',
      textLight900: '#1A1A1A',
      textDark0: '#1A1A1A',
      borderLight200: '#E8E8E8',
      borderLight300: '#D6D6D6',
      borderLight400: '#8A8A8A',
    },
  },
})

type Config = typeof newsfeedConfig
declare module '@gluestack-ui/themed' {
  interface UIConfig extends Config {}
}
