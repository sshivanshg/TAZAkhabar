import { LiveTerminal } from './LiveTerminal'
import { useLiveRun } from '../live/LiveRunContext'

export function LiveRunDock() {
  const { session, clearRun } = useLiveRun()
  if (!session) return null

  return (
    <div className="live-dock">
      <LiveTerminal
        runId={session.runId}
        title={session.sourceLabel}
        onClose={clearRun}
      />
    </div>
  )
}
