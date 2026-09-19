import { TopBar } from '@/components/ui/TopBar'
import { Card } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Inputs'
import { Spinner } from '@/components/ui/Empty'
import { Check } from '@/components/ui/Icons'
import { useExercisesById, usePrograms, useRoutines } from '@/hooks/useData'
import { useSettings } from '@/hooks/useSettings'
import { updateSettings } from '@/db/repo/settings'
import { WEEKDAY_SHORT } from '@/domain/dates'

export default function Programs() {
  const programs = usePrograms()
  const routines = useRoutines()
  const exercisesById = useExercisesById()
  const settings = useSettings()
  if (!programs || !routines) return <Spinner />
  const routineName = (id: string) => routines.find((r) => r.id === id)?.name ?? id

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar back title="Program" />
      {programs.map((p) => (
        <div key={p.id} className="mb-6">
          <h2 className="text-2xl font-bold">{p.name}</h2>
          {p.description && <p className="mb-3 text-sm text-muted">{p.description}</p>}
          {p.phases.map((ph) => {
            const active = settings.activeProgramId === p.id && settings.activePhaseId === ph.id
            return (
              <Card key={ph.id} className={`mb-3 ${active ? 'ring-2 ring-accent' : ''}`}>
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => void updateSettings({ activeProgramId: p.id, activePhaseId: ph.id, nextOverrideRoutineId: null })}>
                  <div>
                    <div className="font-semibold">{ph.name}</div>
                    {ph.description && <div className="mt-1 text-sm text-muted">{ph.description}</div>}
                    <div className="mt-1 text-xs text-muted">
                      {ph.pinnedWeekdays
                        ? Object.entries(ph.pinnedWeekdays).map(([d, rid]) => `${WEEKDAY_SHORT[Number(d)]}: ${routineName(rid)}`).join(' · ')
                        : `Rotation: ${ph.routineIds.map(routineName).join(' → ')}`}
                      {ph.durationWeeks ? ` · ~${ph.durationWeeks} weeks` : ''}
                    </div>
                  </div>
                  <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? 'bg-accent text-white' : 'border border-border text-transparent'}`}>
                    <Check size={16} />
                  </span>
                </button>
                {active && ph.specialization && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-2 text-sm text-muted">Pick ONE exercise per workout to receive {ph.specialization.extraSets} extra sets.</p>
                    {Object.entries(ph.specialization.choices).map(([rid, choices]) => (
                      <label key={rid} className="mb-2 block">
                        <span className="mb-1 block text-sm font-semibold">{routineName(rid)}</span>
                        <Select value={settings.specialization[rid] ?? ''} onChange={(e) => void updateSettings({ specialization: { ...settings.specialization, [rid]: e.target.value } })}>
                          <option value="">No specialization</option>
                          {choices.map((exId) => <option key={exId} value={exId}>{exercisesById[exId]?.name ?? exId}</option>)}
                        </Select>
                      </label>
                    ))}
                  </div>
                )}
                {active && ph.megaLevels && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-2 text-sm text-muted">MEGA level (4 weeks each). The level is a label for your log; the routines carry the rest-pause work.</p>
                    <Segmented value={String(settings.megaLevel) as '1' | '2' | '3'} onChange={(v) => void updateSettings({ megaLevel: Number(v) as 1 | 2 | 3 })} options={[{ value: '1', label: 'Level 1' }, { value: '2', label: 'Level 2' }, { value: '3', label: 'Level 3' }]} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      ))}
    </div>
  )
}
