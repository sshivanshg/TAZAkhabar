import { Text, TextInput } from 'react-native'
import {
  MAX_FONT_SIZE_MULTIPLIER,
} from '../src/accessibility/defaultTextScaling'

type ScalableDefaults = {
  defaultProps?: {
    allowFontScaling?: boolean
    maxFontSizeMultiplier?: number
  }
}

describe('default text scaling', () => {
  it('allows OS font scaling up to the supported 200 percent cap', () => {
    const text = Text as ScalableDefaults
    const input = TextInput as ScalableDefaults

    expect(text.defaultProps?.allowFontScaling).toBe(true)
    expect(text.defaultProps?.maxFontSizeMultiplier).toBe(MAX_FONT_SIZE_MULTIPLIER)
    expect(input.defaultProps?.allowFontScaling).toBe(true)
    expect(input.defaultProps?.maxFontSizeMultiplier).toBe(MAX_FONT_SIZE_MULTIPLIER)
  })
})
