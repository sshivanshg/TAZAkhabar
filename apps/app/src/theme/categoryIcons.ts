import {
  Briefcase,
  HeartPulse,
  LayoutGrid,
  MapPin,
  Newspaper,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native'
import { FEED_CATEGORIES, type FeedCategory, colors } from '../theme/tokens'

export const CATEGORY_ICONS: Record<Exclude<FeedCategory, 'All'>, LucideIcon> = {
  Local: MapPin,
  Health: HeartPulse,
  Sports: Trophy,
  Business: Briefcase,
  State: Newspaper,
}

export function categoryIcon(category: FeedCategory): LucideIcon {
  if (category === 'All') {
    return LayoutGrid
  }
  return CATEGORY_ICONS[category]
}

export const TOPIC_CATEGORIES = FEED_CATEGORIES.filter((c): c is Exclude<FeedCategory, 'All'> => c !== 'All')

export const iconStroke = 1.75
export const iconActive = colors.accent
export const iconInactive = colors.textMuted
