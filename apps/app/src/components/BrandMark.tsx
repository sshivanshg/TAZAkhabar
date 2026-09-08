import Svg, { Circle, Path, Rect } from 'react-native-svg'

type Props = {
  size?: number
}

/** Compact TazaKhabar app mark (blue tile + saffron sun + paper glyph). */
export function BrandMark({ size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityElementsHidden>
      <Rect width={1024} height={1024} rx={224} fill="#155EEF" />
      <Circle cx={512} cy={408} r={208} fill="#FFB000" />
      <Path
        d="M512 112V176M296 201L342 247M728 201L682 247M200 408H264M824 408H760"
        stroke="white"
        strokeWidth={32}
        strokeLinecap="round"
      />
      <Rect x={176} y={368} width={672} height={440} rx={72} fill="white" />
      <Rect x={248} y={456} width={232} height={44} rx={22} fill="#155EEF" />
      <Rect x={248} y={544} width={160} height={164} rx={28} fill="#E8F0FF" />
      <Path d="M276 670L326 616L366 650L408 598L452 670H276Z" fill="#155EEF" />
      <Circle cx={402} cy={584} r={24} fill="#FFB000" />
      <Rect x={532} y={544} width={224} height={36} rx={18} fill="#FFB000" />
      <Rect x={532} y={620} width={224} height={32} rx={16} fill="#155EEF" opacity={0.85} />
      <Rect x={532} y={684} width={168} height={32} rx={16} fill="#155EEF" opacity={0.55} />
    </Svg>
  )
}
