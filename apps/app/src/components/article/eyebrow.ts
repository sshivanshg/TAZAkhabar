import { formatLocationLabel } from '../../utils/formatLocationLabel'

/** Mirrors GLOBAL_CITY_SLUG in storage/cityPreference (not imported: keeps this pure). */
const GLOBAL_CITY_SLUG = 'global'

/**
 * Story eyebrow: the reader's city, else the story's category.
 * Never the "global" pseudo-city, and never the generic "Local" category.
 */
export function storyEyebrow(
  citySlug: string | null | undefined,
  category: string | null | undefined,
): string | undefined {
  const slug = citySlug?.trim().toLowerCase()
  if (slug && slug !== GLOBAL_CITY_SLUG) {
    return formatLocationLabel(slug)
  }
  const cat = category?.trim()
  if (!cat) return undefined
  const lower = cat.toLowerCase()
  if (lower === 'local' || lower === GLOBAL_CITY_SLUG) return undefined
  return cat
}
