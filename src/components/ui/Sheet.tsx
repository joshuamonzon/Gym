import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Close } from './Icons'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Taller sheets for pickers. */
  tall?: boolean
}

/** Bottom sheet rendered in a portal so it escapes any transformed parent. */
export function Sheet({ open, onClose, title, children, tall }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-t-3xl bg-surface pb-safe shadow-2xl ${tall ? 'h-[85dvh]' : 'max-h-[85dvh]'} flex flex-col`}>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-surface-2" />
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-2 text-muted active:bg-surface-2">
            <Close size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
