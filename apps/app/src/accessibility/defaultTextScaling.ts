import { Text, TextInput } from 'react-native'

const MAX_FONT_SIZE_MULTIPLIER = 2

type ScalableComponent = {
  defaultProps?: {
    allowFontScaling?: boolean
    maxFontSizeMultiplier?: number
  }
}

function configure(component: ScalableComponent): void {
  component.defaultProps = {
    ...component.defaultProps,
    allowFontScaling: true,
    maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
  }
}

configure(Text as ScalableComponent)
configure(TextInput as ScalableComponent)

export { MAX_FONT_SIZE_MULTIPLIER }
