import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { NumberField } from '@/components/ui/Inputs'
import { formatRest } from '@/domain/dates'

const PRESETS = [0, 20, 30, 45, 60, 90, 120, 150, 180, 240, 300]

export function RestTimerSheet({ open, onClose, value, onChange, title = 'Rest timer' }: { open: boolean; onClose: () => void; value: number; onChange: (sec: number) => void; title?: string }) {
  const [custom, setCustom] = useState<number | null>(null)
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {PRESETS.map((s) => (
          <Button
            key={s}
            variant={value === s ? 'primary' : 'secondary'}
            onClick={() => {
              onChange(s)
              onClose()
            }}
          >
            {s === 0 ? 'Off' : formatRest(s)}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <NumberField value={custom} onCommit={setCustom} decimals={0} placeholder="Custom seconds" className="text-left" />
        <Button
          disabled={custom === null || custom < 0}
          onClick={() => {
            if (custom !== null) onChange(Math.round(custom))
            onClose()
          }}
        >
          Set
        </Button>
      </div>
    </Sheet>
  )
}
