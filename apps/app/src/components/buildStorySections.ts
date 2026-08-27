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
 * Overflow actions matching Google News copy, wired to TazaKhabar prefs.
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
  const source = article.sourceName?.trim() || 'this source'
  const topic = article.category?.trim()
  const canOpenSource = isHttpsUrl(article.sourceUrl)

  return [
    {
      key: 'primary',
      items: [
        item('save', saved ? 'Remove from saved' : 'Save for later', Bookmark, onSave),
        item('share', 'Share', Share2, onShare),
        ...(canOpenSource
          ? [item('source', `Go to ${source}`, ExternalLink, onOpenSource)]
          : []),
        item('block', `Hide all stories from ${source}`, Ban, onBlockSource, {
          destructive: true,
        }),
      ],
    },
    {
      key: 'signals',
      items: [
        item('like', 'I like this', ThumbsUp, onLike),
        item('dislike', "I don't like this", ThumbsDown, onDislike),
        ...(topic && onFewerAboutTopic
          ? [
              item('fewer', 'Fewer stories about a topic', Frown, onFewerAboutTopic, {
                detail: topic,
              }),
            ]
          : []),
        item('hide', 'Hide this story', EyeOff, onHide),
      ],
    },
  ]
}
