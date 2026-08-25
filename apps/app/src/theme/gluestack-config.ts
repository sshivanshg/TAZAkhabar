import { config as defaultConfig } from '@gluestack-ui/config'
import { createConfig } from '@gluestack-ui/themed'

/** Light theme with a single blue accent. */
export const newsfeedConfig = createConfig({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      primary0: '#F4F6FA',
      primary50: '#EAF0FF',
      primary100: '#D9E4FF',
      primary200: '#B8CAFF',
      primary300: '#8DA9FF',
      primary400: '#5F86FF',
      primary500: '#3A68F0',
      primary600: '#2855E8',
      primary700: '#1F46C4',
      primary800: '#17379B',
      primary900: '#102A77',
      primary950: '#0C225F',
      backgroundLight0: '#F4F6FA',
      backgroundLight50: '#EEF2F6',
      backgroundLight100: '#E4E8EF',
      backgroundDark900: '#101828',
      textLight0: '#F4F6FA',
      textLight50: '#EEF2F6',
      textLight400: '#667085',
      textLight500: '#475467',
      textLight700: '#101828',
      textLight900: '#101828',
      textDark0: '#101828',
      borderLight200: '#E4E8EF',
      borderLight300: '#D8DFE8',
      borderLight400: '#98A2B3',
    },
  },
})

type Config = typeof newsfeedConfig
declare module '@gluestack-ui/themed' {
  interface UIConfig extends Config {}
}
