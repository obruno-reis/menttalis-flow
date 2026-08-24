import { useCallback, useEffect, useMemo, useState } from 'react'
import { startOfDay, startOfWeek } from '../lib/time'
import type { SessionRecord } from '../types'
import { usePersistentState } from './usePersistentState'

const MAX_RECORDS = 400

export interface HistorySummary {
  todaySessions: number
  todaySeconds: number
  weekSessions: number
  weekSeconds: number
}

interface Bounds {
  day: number
  week: number
}

function currentBounds(): Bounds {
  const now = Date.now()
  return { day: startOfDay(now), week: startOfWeek(now) }
}

export function useHistory() {
  const [records, setRecords] = usePersistentState<SessionRecord[]>('history', [])
  /* Kept in state rather than read during render so that a tab left open past
     midnight rolls over to the new day instead of reporting a stale total. */
  const [bounds, setBounds] = useState<Bounds>(currentBounds)

  useEffect(() => {
    const refresh = () =>
      setBounds((prev) => {
        const next = currentBounds()
        return prev.day === next.day && prev.week === next.week ? prev : next
      })
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    const id = window.setInterval(refresh, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(id)
    }
  }, [])

  const add = useCallback(
    (record: Omit<SessionRecord, 'id'>) => {
      setRecords((prev) => [{ ...record, id: `${record.completedAt}-${prev.length}` }, ...prev].slice(0, MAX_RECORDS))
    },
    [setRecords],
  )

  const clear = useCallback(() => setRecords([]), [setRecords])

  const summary = useMemo<HistorySummary>(() => {
    let todaySessions = 0
    let todaySeconds = 0
    let weekSessions = 0
    let weekSeconds = 0

    for (const record of records) {
      if (record.kind !== 'focus') continue
      if (record.completedAt >= bounds.week) {
        weekSessions += 1
        weekSeconds += record.actualSeconds
      }
      if (record.completedAt >= bounds.day) {
        todaySessions += 1
        todaySeconds += record.actualSeconds
      }
    }

    return { todaySessions, todaySeconds, weekSessions, weekSeconds }
  }, [records, bounds])

  return { records, summary, add, clear }
}
