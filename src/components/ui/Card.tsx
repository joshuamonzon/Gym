import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl bg-surface p-4 ${className}`} {...rest} />
}

export function SectionTitle({ className = '', ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`mb-2 text-lg font-semibold text-muted ${className}`} {...rest} />
}
