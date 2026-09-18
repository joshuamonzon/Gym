import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Exercise, Routine } from '@/db/types'
import { Sheet } from '@/components/ui/Sheet'
import { TextInput } from '@/components/ui/Inputs'
import { Search } from '@/components/ui/Icons'

export interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  onPick: (exercise: Exercise) => void
  title?: string
  /** Shown first, e.g. the routine's alternatives for a swap. */
  suggested?: Exercise[]
  blocks?: Routine[]
  onPickBlock?: (routine: Routine) => void
  createLink?: boolean
}

export function ExercisePicker({ open, onClose, exercises, onPick, title = 'Add exercise', suggested, blocks, onPickBlock, createLink = true }: ExercisePickerProps) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = exercises.filter((e) => !e.archived)
    if (!t) return list
    return list.filter((e) => e.name.toLowerCase().includes(t) || e.muscleGroup.includes(t) || e.aliases?.some((a) => a.toLowerCase().includes(t)))
  }, [q, exercises])
  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>()
    for (const e of filtered) {
      const list = map.get(e.muscleGroup) ?? []
      list.push(e)
      map.set(e.muscleGroup, list)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  return (
    <Sheet open={open} onClose={onClose} title={title} tall>
      <div className="relative mb-3">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises" className="pl-10" />
      </div>
      {createLink && (
        <Link to="/exercises/new" onClick={onClose} className="mb-3 block rounded-xl bg-surface-2 px-4 py-3 text-center font-semibold text-accent">
          + Create new exercise
        </Link>
      )}
      {blocks && blocks.length > 0 && !q && (
        <div className="mb-4">
          <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Add a block</h3>
          {blocks.map((r) => (
            <button key={r.id} type="button" onClick={() => onPickBlock?.(r)} className="flex w-full items-center justify-between rounded-xl px-2 py-3 text-left active:bg-surface-2">
              <span>
                <span className="block font-semibold">{r.name}</span>
                <span className="block text-sm text-muted">{r.exercises.length} exercises</span>
              </span>
              <span className="text-accent">Add all</span>
            </button>
          ))}
        </div>
      )}
      {suggested && suggested.length > 0 && !q && (
        <div className="mb-4">
          <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Suggested</h3>
          {suggested.map((e) => (
            <PickRow key={e.id} e={e} onPick={onPick} />
          ))}
        </div>
      )}
      {grouped.map(([group, list]) => (
        <div key={group} className="mb-3">
          <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{group}</h3>
          {list.map((e) => (
            <PickRow key={e.id} e={e} onPick={onPick} />
          ))}
        </div>
      ))}
      {filtered.length === 0 && <p className="py-6 text-center text-muted">No exercises match.</p>}
    </Sheet>
  )
}

function PickRow({ e, onPick }: { e: Exercise; onPick: (e: Exercise) => void }) {
  return (
    <button type="button" onClick={() => onPick(e)} className="flex w-full items-center justify-between rounded-xl px-2 py-3 text-left active:bg-surface-2">
      <span className="block truncate">{e.name}</span>
      <span className="ml-2 shrink-0 text-xs text-muted">{e.equipment.replace('_', ' ')}</span>
    </button>
  )
}
