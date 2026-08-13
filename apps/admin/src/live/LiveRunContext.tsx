import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type LiveRunSession = {
  runId: number
  sourceLabel: string
  startedAt: number
}

type LiveRunContextValue = {
  session: LiveRunSession | null
  watchRun: (runId: number, sourceLabel: string) => void
  clearRun: () => void
}

const LiveRunContext = createContext<LiveRunContextValue | null>(null)

export function LiveRunProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LiveRunSession | null>(null)

  const watchRun = useCallback((runId: number, sourceLabel: string) => {
    setSession({ runId, sourceLabel, startedAt: Date.now() })
  }, [])

  const clearRun = useCallback(() => setSession(null), [])

  const value = useMemo(
    () => ({ session, watchRun, clearRun }),
    [session, watchRun, clearRun],
  )

  return <LiveRunContext.Provider value={value}>{children}</LiveRunContext.Provider>
}

export function useLiveRun() {
  const ctx = useContext(LiveRunContext)
  if (!ctx) throw new Error('useLiveRun requires LiveRunProvider')
  return ctx
}
