import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from './Icons'

export interface TopBarProps {
  title?: ReactNode
  back?: boolean | string
  right?: ReactNode
  large?: boolean
}

export function TopBar({ title, back, right, large }: TopBarProps) {
  const navigate = useNavigate()
  const goBack = () => (typeof back === 'string' ? navigate(back) : navigate(-1))
  return (
    <header className={`sticky top-0 z-30 flex items-center gap-2 bg-black/90 px-3 pt-safe backdrop-blur ${large ? 'pb-1' : 'pb-2'}`}>
      <div className="flex h-12 min-w-0 flex-1 items-center gap-2">
        {back && (
          <button type="button" aria-label="Back" onClick={goBack} className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-white active:bg-surface-2">
            <ChevronLeft />
          </button>
        )}
        {typeof title === 'string' ? (
          <h1 className={`truncate ${large ? 'text-3xl font-bold' : 'text-xl font-semibold'}`}>{title}</h1>
        ) : (
          title
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  )
}
