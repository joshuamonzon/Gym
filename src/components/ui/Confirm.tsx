import { Button } from './Button'
import { Sheet } from './Sheet'

export interface ConfirmProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function Confirm({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: ConfirmProps) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      {message && <p className="mb-4 text-muted">{message}</p>}
      <div className="flex flex-col gap-2">
        <Button variant={danger ? 'danger' : 'primary'} full onClick={onConfirm} className={danger ? 'bg-danger/15' : ''}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" full onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Sheet>
  )
}
