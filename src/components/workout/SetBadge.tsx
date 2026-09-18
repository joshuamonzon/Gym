import type { SetKind } from '@/db/types'
import { setLabel } from '@/lib/format'

export function SetBadge({ kind, index, onClick }: { kind: SetKind; index: number; onClick?: () => void }) {
  const color = kind === 'warmup' ? 'text-warn' : kind === 'activation' || kind === 'mini' ? 'text-accent' : kind === 'extra' ? 'text-success' : 'text-white'
  return (
    <button type="button" onClick={onClick} className={`flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-[15px] font-bold ${color}`}>
      {setLabel(kind, index)}
    </button>
  )
}
