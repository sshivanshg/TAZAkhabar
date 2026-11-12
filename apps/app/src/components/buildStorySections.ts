import type { ComponentType } from 'react'
import Bookmark from 'lucide-react-native/icons/bookmark'
import ExternalLink from 'lucide-react-native/icons/external-link'
import EyeOff from 'lucide-react-native/icons/eye-off'
import Frown from 'lucide-react-native/icons/frown'
import Share2 from 'lucide-react-native/icons/share-2'
import ThumbsDown from 'lucide-react-native/icons/thumbs-down'
import ThumbsUp from 'lucide-react-native/icons/thumbs-up'
import Ban from 'lucide-react-native/icons/ban'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { isHttpsUrl } from '../utils/shareToWhatsApp'
import type { BottomSheetSection } from './ui/BottomSheet'
import { feedCategoryLabel, translate } from '../i18n'

type IconProps = { size?: number; strokeWidth?: number; color?: string; style?: object }

type Args = {
  article: ArticleResponse
  saved: boolean
  onSave: () => void
  onShare: () => void
  onOpenSource: () => void
  onLike: () => void
  onDislike: () => void
  onHide: () => void
  onBlockSource: () => void
  onFewerAboutTopic?: () => void
}

function item(
  key: string,
  label: string,
  Icon: ComponentType<IconProps>,
  onPress: () => void,
  extra?: { destructive?: boolean; detail?: string },
) {
  return { key, label, Icon, onPress, ...extra }
}

/**
 * Overflow actions matching Google News copy, wired to Khabro prefs.
 */
export function buildStorySections({
  article,
  saved,
  onSave,
  onShare,
  onOpenSource,
  onLike,
  onDislike,
  onHide,
  onBlockSource,
  onFewerAboutTopic,
}: Args): BottomSheetSection[] {
  const source = article.sourceName?.trim() || translate('block.thisSource')
  const rawTopic = article.category?.trim()
  const topic = rawTopic ? feedCategoryLabel(translate, rawTopic) : undefined
  const canOpenSource = isHttpsUrl(article.sourceUrl)

  return [
    {
      key: 'primary',
      items: [
        item('save', translate(saved ? 'story.removeFromSaved' : 'story.saveForLater'), Bookmark, onSave),
        item('share', translate('story.share'), Share2, onShare),
        ...(canOpenSource
          ? [item('source', translate('story.goToSource', { source }), ExternalLink, onOpenSource)]
          : []),
        item('block', translate('story.hideAllFrom', { source }), Ban, onBlockSource, {
          destructive: true,
        }),
      ],
    },
    {
      key: 'signals',
      items: [
        item('like', translate('story.like'), ThumbsUp, onLike),
        item('dislike', translate('story.dislike'), ThumbsDown, onDislike),
        ...(topic && onFewerAboutTopic
          ? [
              item('fewer', translate('story.fewerAboutTopic'), Frown, onFewerAboutTopic, {
                detail: topic,
              }),
            ]
          : []),
        item('hide', translate('story.hide'), EyeOff, onHide),
      ],
    },
  ]
}
