import { useCallback, useEffect, useRef, useState } from 'react'

interface TimerState {
  /** epoch ms when the current run is scheduled to end; null when not running */
  endAt: number | null
  /** ms left when paused/idle; source of truth while not running */
  pausedRemainingMs: number
  totalMs: number
  isRunning: boolean
}

export interface TimerEngine {
  remainingMs: number
  totalMs: number
  isRunning: boolean
  progress: number /* 0..1 elapsed */
  start: (durationMs?: number) => void
  pause: () => void
  resume: () => void
  reset: (durationMs?: number) => void
  addTime: (deltaMs: number) => void
}

/**
 * Timestamp-based timer. The truth is always `endAt - Date.now()`, never an
 * accumulator, so background-tab throttling, device sleep, and dropped frames
 * can never introduce drift.
 */
export function useTimerEngine(initialDurationMs: number, onComplete?: () => void): TimerEngine {
  const [state, setState] = useState<TimerState>({
    endAt: null,
    pausedRemainingMs: initialDurationMs,
    totalMs: initialDurationMs,
    isRunning: false,
  })
  /* Only meaningful while running; when idle the paused value is authoritative. */
  const [tickRemainingMs, setTickRemainingMs] = useState(initialDurationMs)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  const completedRef = useRef(false)

  /* Ticking loop — reads wall-clock time, so its own cadence is irrelevant. */
  useEffect(() => {
    if (!state.isRunning || state.endAt === null) return

    completedRef.current = false
    const endAt = state.endAt

    const tick = () => {
      const left = endAt - Date.now()
      if (left <= 0) {
        setTickRemainingMs(0)
        if (!completedRef.current) {
          completedRef.current = true
          setState((prev) => ({ ...prev, isRunning: false, endAt: null, pausedRemainingMs: 0 }))
          onCompleteRef.current?.()
        }
        return
      }
      setTickRemainingMs(left)
    }

    tick()
    /* 200ms is well inside the eye's tolerance for a seconds readout while
       halving re-renders; because each tick reads the wall clock, a throttled
       or delayed interval still reports the correct time when it next fires. */
    const id = window.setInterval(tick, 200)

    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [state.isRunning, state.endAt])

  const start = useCallback(
    (durationMs?: number) => {
      const total = durationMs ?? initialDurationMs
      completedRef.current = false
      setTickRemainingMs(total)
      setState({
        endAt: Date.now() + total,
        pausedRemainingMs: total,
        totalMs: total,
        isRunning: true,
      })
    },
    [initialDurationMs],
  )

  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning || prev.endAt === null) return prev
      return {
        ...prev,
        isRunning: false,
        endAt: null,
        pausedRemainingMs: Math.max(0, prev.endAt - Date.now()),
      }
    })
  }, [])

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.isRunning || prev.pausedRemainingMs <= 0) return prev
      completedRef.current = false
      return { ...prev, isRunning: true, endAt: Date.now() + prev.pausedRemainingMs }
    })
  }, [])

  const reset = useCallback(
    (durationMs?: number) => {
      const total = durationMs ?? initialDurationMs
      completedRef.current = false
      setTickRemainingMs(total)
      setState({ endAt: null, pausedRemainingMs: total, totalMs: total, isRunning: false })
    },
    [initialDurationMs],
  )

  const addTime = useCallback((deltaMs: number) => {
    setState((prev) => {
      const nextTotal = Math.max(60_000, prev.totalMs + deltaMs)
      if (prev.isRunning && prev.endAt !== null) {
        const left = Math.max(1000, Math.max(0, prev.endAt - Date.now()) + deltaMs)
        return { ...prev, totalMs: nextTotal, endAt: Date.now() + left, pausedRemainingMs: left }
      }
      const left = Math.max(60_000, prev.pausedRemainingMs + deltaMs)
      return { ...prev, totalMs: nextTotal, pausedRemainingMs: left }
    })
  }, [])

  const remainingMs = state.isRunning ? tickRemainingMs : state.pausedRemainingMs
  const progress = state.totalMs > 0 ? 1 - remainingMs / state.totalMs : 0

  return {
    remainingMs,
    totalMs: state.totalMs,
    isRunning: state.isRunning,
    progress: Math.min(1, Math.max(0, progress)),
    start,
    pause,
    resume,
    reset,
    addTime,
  }
}
