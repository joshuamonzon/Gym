import { useNavigate } from 'react-router'
import { TopBar } from '@/components/ui/TopBar'
import { ListGroup, ListRow } from '@/components/ui/ListRow'
import { Toggle } from '@/components/ui/Toggle'
import { Segmented } from '@/components/ui/Segmented'
import { NumberField } from '@/components/ui/Inputs'
import { useSettings } from '@/hooks/useSettings'
import { useActiveProgram } from '@/hooks/useData'
import { updateSettings } from '@/db/repo/settings'
import { WEEKDAY_SHORT } from '@/domain/dates'
import { isStandalone } from '@/lib/storage'

export default function Settings() {
  const s = useSettings()
  const { program, phase } = useActiveProgram()
  const navigate = useNavigate()
  const toggleDay = (d: number) => {
    const days = s.trainingDays.includes(d) ? s.trainingDays.filter((x) => x !== d) : [...s.trainingDays, d].sort()
    void updateSettings({ trainingDays: days })
  }
  const rest = (k: keyof typeof s.restDefaults) => (v: number | null) => void updateSettings({ restDefaults: { ...s.restDefaults, [k]: Math.max(0, Math.round(v ?? 0)) } })

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar back title="Settings" />
      <ListGroup title="Program">
        <ListRow label={program?.name ?? 'Program'} sub={phase?.name ?? 'No phase selected'} onClick={() => navigate('/programs')} />
      </ListGroup>

      <ListGroup title="Schedule">
        <div className="px-4 py-3">
          <div className="mb-2 text-sm text-muted">Training days</div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <button key={d} type="button" onClick={() => toggleDay(d)} className={`h-10 flex-1 rounded-xl text-sm font-semibold ${s.trainingDays.includes(d) ? 'bg-accent text-white' : 'bg-surface-2 text-muted'}`}>
                {WEEKDAY_SHORT[d]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">The Advanced split ignores this and pins Mon / Wed / Fri.</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span>Week starts on</span>
          <Segmented value={String(s.weekStartsOn) as '0' | '1'} onChange={(v) => void updateSettings({ weekStartsOn: Number(v) as 0 | 1 })} options={[{ value: '1', label: 'Mon' }, { value: '0', label: 'Sun' }]} />
        </div>
        <Row label="Abs sessions per week"><Num value={s.absPerWeek} onCommit={(v) => void updateSettings({ absPerWeek: Math.max(0, Math.round(v ?? 0)) })} /></Row>
        <Row label="Mobility sessions per week"><Num value={s.mobilityPerWeek} onCommit={(v) => void updateSettings({ mobilityPerWeek: Math.max(0, Math.round(v ?? 0)) })} /></Row>
      </ListGroup>

      <ListGroup title="Units">
        <div className="flex items-center justify-between px-4 py-3">
          <span>Weight</span>
          <Segmented value={s.unit} onChange={(unit) => void updateSettings({ unit })} options={[{ value: 'lb', label: 'lbs' }, { value: 'kg', label: 'kg' }]} />
        </div>
      </ListGroup>

      <ListGroup title="Rest timer defaults (seconds)">
        <Row label="RPT compound sets"><Num value={s.restDefaults.rpt} onCommit={rest('rpt')} /></Row>
        <Row label="Accessory sets"><Num value={s.restDefaults.accessory} onCommit={rest('accessory')} /></Row>
        <Row label="Rest-pause mini-sets"><Num value={s.restDefaults.restPause} onCommit={rest('restPause')} /></Row>
        <Row label="Warm-up sets"><Num value={s.restDefaults.warmup} onCommit={rest('warmup')} /></Row>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div>Timer sound</div>
            <div className="text-xs text-muted">Beeps when rest is over (needs the ring switch on, or the keep-awake option).</div>
          </div>
          <Toggle checked={s.timerSound} onChange={(v) => void updateSettings({ timerSound: v })} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div>Auto warm-up sets</div>
            <div className="text-xs text-muted">50% × 5 and 75% × 3 before RPT lifts.</div>
          </div>
          <Toggle checked={s.autoWarmups} onChange={(v) => void updateSettings({ autoWarmups: v })} />
        </div>
      </ListGroup>

      <ListGroup title="Data">
        <ListRow label="Backup & restore" sub={s.lastBackupAt ? `Last backup ${new Date(s.lastBackupAt).toLocaleDateString()}` : 'Never backed up'} onClick={() => navigate('/settings/data')} />
      </ListGroup>

      <ListGroup title="About">
        <div className="px-4 py-3 text-sm text-muted">
          <p>Greek God Program 2.0 tracker. Everything is stored on this device.</p>
          {!isStandalone() && <p className="mt-2">Tip: in Safari tap Share → <span className="text-white">Add to Home Screen</span> for full-screen use, offline access and safer storage.</p>}
        </div>
      </ListGroup>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <span>{label}</span>
      <div className="w-24">{children}</div>
    </div>
  )
}
function Num({ value, onCommit }: { value: number; onCommit: (v: number | null) => void }) {
  return <NumberField value={value} decimals={0} onCommit={onCommit} />
}
