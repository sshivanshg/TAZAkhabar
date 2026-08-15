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
      primary600: '#3F5BEA',
      primary700: '#2F49D6',
      primary800: '#1A1B1E',
      primary900: '#1A1B1E',
      primary950: '#0A0A0A',
      backgroundLight0: '#FFFFFF',
      backgroundLight50: '#F5F6FA',
      backgroundLight100: '#F5F6FA',
      backgroundDark900: '#1A1B1E',
      textLight0: '#FFFFFF',
      textLight50: '#F5F6FA',
      textLight400: '#6B6E76',
      textLight500: '#6B6E76',
      textLight700: '#1A1B1E',
      textLight900: '#1A1B1E',
      textDark0: '#1A1B1E',
      borderLight200: '#ECEDF1',
      borderLight300: '#ECEDF1',
      borderLight400: '#6B6E76',
    },
  },
})

type Config = typeof newsfeedConfig
declare module '@gluestack-ui/themed' {
  interface UIConfig extends Config {}
}
