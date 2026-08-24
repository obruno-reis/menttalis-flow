import { useCallback, useEffect, useRef, useState } from 'react'
import { playTone } from '../lib/sound'
import type { SoundMode } from '../types'
import { useHistory } from './useHistory'
import { useTimerEngine } from './useTimerEngine'

export type FlowStage = 'setup' | 'focus' | 'focus-complete' | 'break'

interface Options {
  durationSeconds: number
  breakSeconds: number
  intention: string
  soundMode: SoundMode
  volume: number
  cyclesUntilLongBreak: number
}

export function useFocusSession(options: Options) {
  const { durationSeconds, breakSeconds, intention, soundMode, volume, cyclesUntilLongBreak } = options

  const [stage, setStage] = useState<FlowStage>('setup')
  const [completedCycles, setCompletedCycles] = useState(0)
  const history = useHistory()

  /* Latest-value refs so the timer's completion callback never sees stale state. */
  const stageRef = useRef(stage)
  const soundRef = useRef({ soundMode, volume })
  useEffect(() => {
    stageRef.current = stage
    soundRef.current = { soundMode, volume }
  })

  const handleComplete = useCallback(() => {
    const current = stageRef.current
    const { soundMode: mode, volume: vol } = soundRef.current

    if (current === 'focus') {
      history.add({
        kind: 'focus',
        intention,
        plannedSeconds: durationSeconds,
        actualSeconds: durationSeconds,
        completedAt: Date.now(),
      })
      setCompletedCycles((n) => n + 1)
      setStage('focus-complete')
      playTone('complete', mode, vol)
      return
    }

    if (current === 'break') {
      setStage('setup')
      playTone('complete', mode, vol)
    }
  }, [durationSeconds, history, intention])

  const timer = useTimerEngine(durationSeconds * 1000, handleComplete)

  /* Keep the idle timer in sync with the chosen duration. */
  useEffect(() => {
    if (stage === 'setup') timer.reset(durationSeconds * 1000)
  }, [durationSeconds, stage, timer.reset]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLongBreakDue = completedCycles > 0 && completedCycles % cyclesUntilLongBreak === 0
  const nextBreakSeconds = isLongBreakDue ? breakSeconds * 3 : breakSeconds

  const startFocus = useCallback(() => {
    setStage('focus')
    timer.start(durationSeconds * 1000)
    playTone('start', soundMode, volume)
  }, [durationSeconds, soundMode, timer, volume])

  const startBreak = useCallback(() => {
    setStage('break')
    timer.start(nextBreakSeconds * 1000)
    playTone('breakStart', soundMode, volume)
  }, [nextBreakSeconds, soundMode, timer, volume])

  const skipBreak = useCallback(() => {
    setStage('setup')
    timer.reset(durationSeconds * 1000)
  }, [durationSeconds, timer])

  const togglePause = useCallback(() => {
    if (timer.isRunning) {
      timer.pause()
      playTone('pause', soundMode, volume)
    } else {
      timer.resume()
      playTone('start', soundMode, volume)
    }
  }, [soundMode, timer, volume])

  const restart = useCallback(() => {
    const total = stage === 'break' ? nextBreakSeconds : durationSeconds
    timer.start(total * 1000)
  }, [durationSeconds, nextBreakSeconds, stage, timer])

  /** Ends the current session early. Time already spent still counts. */
  const endSession = useCallback(() => {
    if (stage === 'focus') {
      const spentSeconds = Math.round((durationSeconds * 1000 - timer.remainingMs) / 1000)
      if (spentSeconds >= 60) {
        history.add({
          kind: 'focus',
          intention,
          plannedSeconds: durationSeconds,
          actualSeconds: spentSeconds,
          completedAt: Date.now(),
        })
      }
    }
    setStage('setup')
    timer.reset(durationSeconds * 1000)
  }, [durationSeconds, history, intention, stage, timer])

  return {
    stage,
    timer,
    history,
    completedCycles,
    isLongBreakDue,
    nextBreakSeconds,
    startFocus,
    startBreak,
    skipBreak,
    togglePause,
    restart,
    endSession,
  }
}
