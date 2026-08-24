import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

type Variant = 'primary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  size?: Size
  tone?: 'accent' | 'break'
  disabled?: boolean
  'aria-label'?: string
  'aria-pressed'?: boolean
  title?: string
  className?: string
  type?: 'button' | 'submit'
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-8 text-[15px]',
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  size = 'md',
  tone = 'accent',
  disabled,
  className = '',
  type = 'button',
  ...aria
}: Props) {
  const reduced = useReducedMotion()
  const accent = tone === 'break' ? 'var(--break)' : 'var(--accent)'

  const styles: Record<Variant, React.CSSProperties> = {
    primary: {
      background: accent,
      color: 'var(--accent-ink)',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-md)',
      fontWeight: 600,
    },
    ghost: {
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      fontWeight: 500,
    },
    quiet: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
      fontWeight: 500,
    },
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap select-none disabled:opacity-40 disabled:pointer-events-none ${SIZES[size]} ${className}`}
      style={{
        ...styles[variant],
        transition: 'background var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard)',
      }}
      whileHover={reduced || disabled ? undefined : { y: -2, scale: 1.02 }}
      whileTap={reduced || disabled ? undefined : { y: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 480, damping: 26, mass: 0.4 }}
      {...aria}
    >
      {children}
    </motion.button>
  )
}
