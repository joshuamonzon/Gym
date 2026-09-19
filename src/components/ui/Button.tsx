import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white active:bg-accent-strong',
  secondary: 'bg-surface text-white active:bg-surface-2',
  danger: 'bg-surface text-danger active:bg-surface-2',
  ghost: 'bg-transparent text-accent active:opacity-70',
  success: 'bg-success text-black active:opacity-80',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-[15px] rounded-xl',
  lg: 'h-13 px-5 text-base rounded-2xl',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
}

export function Button({ variant = 'primary', size = 'md', full, className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  )
}
