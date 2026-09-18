import type { ReactNode } from 'react'
import { ChevronRight } from './Icons'

export interface ListRowProps {
  label: ReactNode
  sub?: ReactNode
  value?: ReactNode
  onClick?: () => void
  chevron?: boolean
  icon?: ReactNode
  danger?: boolean
}

export function ListRow({ label, sub, value, onClick, chevron, icon, danger }: ListRowProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left ${onClick ? 'active:bg-surface-2' : ''} ${danger ? 'text-danger' : ''}`}
    >
      {icon && <span className="shrink-0 text-muted">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px]">{label}</span>
        {sub && <span className="block truncate text-sm text-muted">{sub}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-muted">{value}</span>}
      {(chevron ?? Boolean(onClick)) && <ChevronRight size={18} className="shrink-0 text-muted" />}
    </Tag>
  )
}

export function ListGroup({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section className="mb-5">
      {title && <h3 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>}
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">{children}</div>
    </section>
  )
}
