import type { FeedSection } from '@tazakhabar/shared-types'
import { FEED_CATEGORY_LABEL_KEYS, isFeedCategory } from '../theme/tokens'
import type { StringKey } from '../i18n/runtime'

/** API keys from FeedSectionBuilder (apps/api/Services/FeedSectionBuilder.cs). */
const SECTION_KEY_LABELS: Record<string, StringKey> = {
  top: 'home.topStories',
  more: 'home.moreStories',
}

/** Translate known feed sections; unknown ones keep the API's English title. */
export function sectionTitle(
  section: Pick<FeedSection, 'key' | 'title' | 'category'>,
  t: (key: StringKey) => string,
): string {
  const fixed = section.key ? SECTION_KEY_LABELS[section.key] : undefined
  if (fixed) return t(fixed)
  if (isFeedCategory(section.category)) return t(FEED_CATEGORY_LABEL_KEYS[section.category])
  return section.title ?? ''
}
