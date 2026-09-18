import type { ReactNode } from 'react'

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface p-6 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  )
}

export function Spinner() {
  return <div className="mx-auto my-10 h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-white" />
}
