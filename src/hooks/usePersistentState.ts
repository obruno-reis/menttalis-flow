import { useEffect, useState } from 'react'
import { readStorage, writeStorage } from '../lib/storage'

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, initial))

  useEffect(() => {
    writeStorage(key, value)
  }, [key, value])

  return [value, setValue] as const
}
