import { useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'

export function Toast() {
  const toast = useUiStore((s) => s.toast)
  const dismiss = useUiStore((s) => s.dismissToast)
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(dismiss, toast.actionLabel ? 8000 : 3500)
    return () => window.clearTimeout(t)
  }, [toast, dismiss])
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm shadow-xl">
        <span>{toast.message}</span>
        {toast.actionLabel && (
          <button
            type="button"
            className="font-semibold text-accent"
            onClick={() => {
              toast.onAction?.()
              dismiss()
            }}
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
