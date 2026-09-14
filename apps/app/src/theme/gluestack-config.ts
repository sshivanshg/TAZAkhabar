import { config as defaultConfig } from '@gluestack-ui/config'
import { createConfig } from '@gluestack-ui/themed'

/** Light theme with a single blue accent. */
export const tazakhabarConfig = createConfig({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      primary0: '#F4F6FA',
      primary50: '#EFF6FF',
      primary100: '#DBEAFE',
      primary200: '#BFDBFE',
      primary300: '#93C5FD',
      primary400: '#60A5FA',
      primary500: '#3B82F6',
      primary600: '#2563EB',
      primary700: '#1D4ED8',
      primary800: '#1E40AF',
      primary900: '#1E3A8A',
      primary950: '#172554',
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

type Config = typeof tazakhabarConfig
declare module '@gluestack-ui/themed' {
  interface UIConfig extends Config {}
}
