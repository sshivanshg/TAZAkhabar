import type { ComponentType } from 'react'
import Briefcase from 'lucide-react-native/icons/briefcase'
import HeartPulse from 'lucide-react-native/icons/heart-pulse'
import LayoutGrid from 'lucide-react-native/icons/layout-grid'
import MapPin from 'lucide-react-native/icons/map-pin'
import Newspaper from 'lucide-react-native/icons/newspaper'
import Trophy from 'lucide-react-native/icons/trophy'
import { FEED_CATEGORIES, type FeedCategory, type AppColors } from '../theme/tokens'

export type AppIcon = ComponentType<{
  size?: number
  color?: string
  strokeWidth?: number
  style?: object
}>

export const CATEGORY_ICONS: Record<Exclude<FeedCategory, 'All'>, AppIcon> = {
  Local: MapPin,
  Health: HeartPulse,
  Sports: Trophy,
  Business: Briefcase,
  State: Newspaper,
}

export function categoryIcon(category: FeedCategory): AppIcon {
  if (category === 'All') {
    return LayoutGrid
  }
  return CATEGORY_ICONS[category]
}

export const TOPIC_CATEGORIES = FEED_CATEGORIES.filter((c): c is Exclude<FeedCategory, 'All'> => c !== 'All')

export const iconStroke = 1.75

export function iconActiveColor(colors: AppColors): string {
  return colors.accent
}

export function iconInactiveColor(colors: AppColors): string {
  return colors.textMuted
}
