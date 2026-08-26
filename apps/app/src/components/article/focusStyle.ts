import { Platform, type PressableStateCallbackType, type ViewStyle } from 'react-native'
import { readerColors } from '../../theme/readerTokens'

export type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

export function webFocusRing(focused: boolean): ViewStyle | undefined {
  if (!focused || Platform.OS !== 'web') {
    return undefined
  }
  return {
    outlineWidth: 2,
    outlineColor: readerColors.accent,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as ViewStyle
}

export function pressableState(state: PressableStateCallbackType): WebPressableState {
  return state as WebPressableState
}
