import { Sparkle } from './Sparkle'

export function Wordmark({ muted = false }: { muted?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <Sparkle size={15} color={muted ? 'var(--text-muted)' : 'var(--accent-line)'} withDots={false} />
      <span
        className="text-[11px] font-semibold tracking-[0.2em] uppercase"
        style={{ color: muted ? 'var(--text-muted)' : 'var(--text-secondary)' }}
      >
        Menttalis Flow
      </span>
    </div>
  )
}
