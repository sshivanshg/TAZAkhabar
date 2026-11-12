import type { ViewStyle } from 'react-native'

const cardPressed: ViewStyle = { opacity: 0.85, transform: [{ scale: 0.98 }] }
const iconPressed: ViewStyle = { opacity: 0.6 }

/** Cards and chips: opacity 0.85 + scale 0.98 while pressed. */
export function cardPress(pressed: boolean): ViewStyle | null {
  return pressed ? cardPressed : null
}

/** Icon buttons: opacity 0.6 while pressed. */
export function iconPress(pressed: boolean): ViewStyle | null {
  return pressed ? iconPressed : null
}
