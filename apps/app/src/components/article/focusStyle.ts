import { Platform, type PressableStateCallbackType, type ViewStyle } from 'react-native'
import type { ReaderColors } from '../../theme/readerTokens'

export type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

export function webFocusRing(
  focused: boolean,
  palette: ReaderColors,
): ViewStyle | undefined {
  if (!focused || Platform.OS !== 'web') {
    return undefined
  }
  return {
    outlineWidth: 2,
    outlineColor: palette.accent,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as ViewStyle
}

export function pressableState(state: PressableStateCallbackType): WebPressableState {
  return state as WebPressableState
}
