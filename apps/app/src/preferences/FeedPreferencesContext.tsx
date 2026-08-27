import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ArticleResponse } from '@tazakhabar/shared-types'

const STORAGE_KEY = 'tazakhabar.feedPreferences.v1'

export type FeedPreferencesState = {
  /** Story IDs hidden via "Hide this story" */
  hiddenStoryIds: number[]
  /** Source names blocked locally */
  blockedSources: string[]
  /** Categories blocked locally (not "All") */
  blockedCategories: string[]
  /** Categories marked "show more like this" — UI-only signal */
  preferMoreCategories: string[]
  /** Categories marked "show less like this" — UI-only signal */
  preferLessCategories: string[]
}

const EMPTY: FeedPreferencesState = {
  hiddenStoryIds: [],
  blockedSources: [],
  blockedCategories: [],
  preferMoreCategories: [],
  preferLessCategories: [],
}

type FeedPreferencesContextValue = FeedPreferencesState & {
  ready: boolean
  hideStory: (id: number) => void
  blockSource: (sourceName: string) => void
  unblockSource: (sourceName: string) => void
  blockCategory: (category: string) => void
  unblockCategory: (category: string) => void
  showMoreLikeThis: (category: string) => void
  showLessLikeThis: (category: string) => void
  filterArticles: (articles: ArticleResponse[]) => ArticleResponse[]
  isSourceBlocked: (sourceName: string) => boolean
  isCategoryBlocked: (category: string) => boolean
}

const FeedPreferencesContext = createContext<FeedPreferencesContextValue | null>(null)

function uniquePush(list: string[], value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed) {
    return list
  }
  if (list.some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
    return list
  }
  return [...list, trimmed]
}

function uniqueRemove(list: string[], value: string): string[] {
  const lower = value.trim().toLowerCase()
  return list.filter((x) => x.toLowerCase() !== lower)
}

export function FeedPreferencesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FeedPreferencesState>(EMPTY)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) {
          return
        }
        try {
          const parsed = JSON.parse(raw) as Partial<FeedPreferencesState>
          setState({
            hiddenStoryIds: parsed.hiddenStoryIds ?? [],
            blockedSources: parsed.blockedSources ?? [],
            blockedCategories: parsed.blockedCategories ?? [],
            preferMoreCategories: parsed.preferMoreCategories ?? [],
            preferLessCategories: parsed.preferLessCategories ?? [],
          })
        } catch {
          // ignore corrupt storage
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) {
      return
    }
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [ready, state])

  const hideStory = useCallback((id: number) => {
    setState((prev) =>
      prev.hiddenStoryIds.includes(id)
        ? prev
        : { ...prev, hiddenStoryIds: [...prev.hiddenStoryIds, id] },
    )
  }, [])

  const blockSource = useCallback((sourceName: string) => {
    setState((prev) => ({
      ...prev,
      blockedSources: uniquePush(prev.blockedSources, sourceName),
    }))
  }, [])

  const unblockSource = useCallback((sourceName: string) => {
    setState((prev) => ({
      ...prev,
      blockedSources: uniqueRemove(prev.blockedSources, sourceName),
    }))
  }, [])

  const blockCategory = useCallback((category: string) => {
    if (category === 'All') {
      return
    }
    setState((prev) => ({
      ...prev,
      blockedCategories: uniquePush(prev.blockedCategories, category),
    }))
  }, [])

  const unblockCategory = useCallback((category: string) => {
    setState((prev) => ({
      ...prev,
      blockedCategories: uniqueRemove(prev.blockedCategories, category),
    }))
  }, [])

  const showMoreLikeThis = useCallback((category: string) => {
    if (!category || category === 'All') {
      return
    }
    setState((prev) => ({
      ...prev,
      preferMoreCategories: uniquePush(prev.preferMoreCategories, category),
      preferLessCategories: uniqueRemove(prev.preferLessCategories, category),
    }))
  }, [])

  const showLessLikeThis = useCallback((category: string) => {
    if (!category || category === 'All') {
      return
    }
    setState((prev) => ({
      ...prev,
      preferLessCategories: uniquePush(prev.preferLessCategories, category),
      preferMoreCategories: uniqueRemove(prev.preferMoreCategories, category),
    }))
  }, [])

  const isSourceBlocked = useCallback(
    (sourceName: string) =>
      state.blockedSources.some((s) => s.toLowerCase() === sourceName.trim().toLowerCase()),
    [state.blockedSources],
  )

  const isCategoryBlocked = useCallback(
    (category: string) =>
      state.blockedCategories.some((c) => c.toLowerCase() === category.trim().toLowerCase()),
    [state.blockedCategories],
  )

  const preferenceScore = useCallback(
    (category: string | undefined) => {
      const cat = (category ?? '').trim().toLowerCase()
      if (!cat) {
        return 0
      }
      if (state.preferMoreCategories.some((c) => c.toLowerCase() === cat)) {
        return -1
      }
      if (state.preferLessCategories.some((c) => c.toLowerCase() === cat)) {
        return 1
      }
      return 0
    },
    [state.preferLessCategories, state.preferMoreCategories],
  )

  const filterArticles = useCallback(
    (articles: ArticleResponse[]) => {
      const filtered = articles.filter((article) => {
        if (article.id != null && state.hiddenStoryIds.includes(article.id)) {
          return false
        }
        const source = article.sourceName ?? ''
        if (source && isSourceBlocked(source)) {
          return false
        }
        const category = article.category ?? ''
        if (category && isCategoryBlocked(category)) {
          return false
        }
        return true
      })
      // Prefer-more categories first, prefer-less last; stable otherwise.
      return filtered
        .map((article, index) => ({ article, index }))
        .sort((a, b) => {
          const diff =
            preferenceScore(a.article.category) - preferenceScore(b.article.category)
          return diff !== 0 ? diff : a.index - b.index
        })
        .map(({ article }) => article)
    },
    [
      isCategoryBlocked,
      isSourceBlocked,
      preferenceScore,
      state.hiddenStoryIds,
    ],
  )

  const value = useMemo<FeedPreferencesContextValue>(
    () => ({
      ...state,
      ready,
      hideStory,
      blockSource,
      unblockSource,
      blockCategory,
      unblockCategory,
      showMoreLikeThis,
      showLessLikeThis,
      filterArticles,
      isSourceBlocked,
      isCategoryBlocked,
    }),
    [
      state,
      ready,
      hideStory,
      blockSource,
      unblockSource,
      blockCategory,
      unblockCategory,
      showMoreLikeThis,
      showLessLikeThis,
      filterArticles,
      isSourceBlocked,
      isCategoryBlocked,
    ],
  )

  return (
    <FeedPreferencesContext.Provider value={value}>{children}</FeedPreferencesContext.Provider>
  )
}

export function useFeedPreferences(): FeedPreferencesContextValue {
  const ctx = useContext(FeedPreferencesContext)
  if (!ctx) {
    throw new Error('useFeedPreferences must be used within FeedPreferencesProvider')
  }
  return ctx
}
