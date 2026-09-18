import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Inputs'
import { Plus, Search } from '@/components/ui/Icons'
import { ListGroup, ListRow } from '@/components/ui/ListRow'
import { Spinner } from '@/components/ui/Empty'
import { useExercises } from '@/hooks/useData'

export default function Exercises() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const all = useExercises(true)
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = (all ?? []).filter((e) => (showArchived || !e.archived) && (!t || e.name.toLowerCase().includes(t) || e.muscleGroup.includes(t)))
    const map = new Map<string, typeof list>()
    for (const e of list) map.set(e.muscleGroup, [...(map.get(e.muscleGroup) ?? []), e])
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [all, q, showArchived])

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar back="/profile" title="Exercises" right={<Button size="sm" onClick={() => navigate('/exercises/new')}><Plus size={16} /> New</Button>} />
      <div className="relative mb-4">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-10" />
      </div>
      {!all ? (
        <Spinner />
      ) : (
        groups.map(([group, list]) => (
          <ListGroup key={group} title={group}>
            {list.map((e) => (
              <ListRow key={e.id} label={`${e.name}${e.archived ? ' (archived)' : ''}`} sub={`${e.equipment.replace('_', ' ')} · ${e.defaultScheme.replace('_', '-')}`} onClick={() => navigate(`/exercises/${e.id}`)} />
            ))}
          </ListGroup>
        ))
      )}
      <button type="button" onClick={() => setShowArchived((v) => !v)} className="mb-6 w-full text-center text-sm text-muted">
        {showArchived ? 'Hide archived' : 'Show archived'}
      </button>
    </div>
  )
}
