import { TAB_BAR_CONTENT_GAP } from '../theme/tokens'

/**
 * Extra scroll padding under the last item. The tab bar is in normal
 * document flow (not absolute), so only a small breathing gap is needed.
 */
export function useTabBarClearance(): number {
  return TAB_BAR_CONTENT_GAP
}
