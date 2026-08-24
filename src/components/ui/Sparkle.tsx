interface Props {
  size?: number
  color?: string
  withDots?: boolean
  className?: string
}

/** The Menttalis mark: a four-point star framed by four dots. */
export function Sparkle({ size = 20, color = 'var(--accent-line)', withDots = true, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      aria-hidden="true"
      className={className}
    >
      <path d="M50 12 Q 55 44 88 50 Q 55 56 50 88 Q 45 56 12 50 Q 45 44 50 12 Z" />
      {withDots && (
        <>
          <circle cx="20" cy="20" r="7.5" />
          <circle cx="80" cy="20" r="7.5" />
          <circle cx="20" cy="80" r="7.5" />
          <circle cx="80" cy="80" r="7.5" />
        </>
      )}
    </svg>
  )
}
