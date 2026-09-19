import { useEffect, useRef, useState } from 'react'
import { TopBar } from '@/components/ui/TopBar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Confirm } from '@/components/ui/Confirm'
import { Download, Upload } from '@/components/ui/Icons'
import { exportBackup, importBackup, resetDatabase } from '@/db/repo/backup'
import { backupFileName, parseBackup, type BackupFile } from '@/domain/backup'
import { saveTextFile } from '@/lib/download'
import { isStoragePersisted, requestPersistentStorage } from '@/lib/storage'
import { useUiStore } from '@/store/uiStore'

export default function DataSettings() {
  const showToast = useUiStore((s) => s.showToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  useEffect(() => {
    void isStoragePersisted().then(setPersisted)
  }, [])

  const doExport = async () => {
    const b = await exportBackup()
    const how = await saveTextFile(backupFileName(b.exportedAt), JSON.stringify(b))
    showToast(how === 'shared' ? 'Backup shared.' : 'Backup downloaded.')
  }
  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }
  const doImport = async () => {
    if (!pending) return
    await importBackup(pending)
    setPending(null)
    showToast(`Restored ${pending.tables.workouts.length} workouts.`)
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar back title="Backup & restore" />
      <Card className="mb-3">
        <h2 className="font-semibold">Export</h2>
        <p className="mb-3 text-sm text-muted">Saves every workout, routine, exercise, measurement and setting as one JSON file. Keep it somewhere safe (Files, iCloud, email).</p>
        <Button full onClick={() => void doExport()}>
          <Download size={18} /> Export backup
        </Button>
      </Card>
      <Card className="mb-3">
        <h2 className="font-semibold">Restore</h2>
        <p className="mb-3 text-sm text-muted">Replaces everything on this device with the contents of a backup file.</p>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        <Button variant="secondary" full onClick={() => fileRef.current?.click()}>
          <Upload size={18} /> Choose backup file
        </Button>
      </Card>
      <Card className="mb-3">
        <h2 className="font-semibold">Storage</h2>
        <p className="mb-3 text-sm text-muted">
          {persisted === true ? 'The browser has marked this data as persistent.' : persisted === false ? 'Not yet marked persistent. Safari can clear data for sites you have not used in a week; adding the app to your Home Screen avoids that.' : 'Persistence status unavailable in this browser.'}
        </p>
        {persisted === false && (
          <Button variant="secondary" full onClick={async () => { setPersisted(await requestPersistentStorage()); }}>
            Request persistent storage
          </Button>
        )}
      </Card>
      <Card>
        <h2 className="font-semibold text-danger">Danger zone</h2>
        <p className="mb-3 text-sm text-muted">Deletes everything and reloads with the built-in program.</p>
        <Button variant="danger" full onClick={() => setResetOpen(true)}>Reset all data</Button>
      </Card>

      <Confirm open={pending !== null} title="Restore this backup?" message={pending ? `From ${new Date(pending.exportedAt).toLocaleString()} · ${pending.tables.workouts.length} workouts, ${pending.tables.exercises.length} exercises. Current data will be replaced.` : ''} confirmLabel="Replace everything" danger onCancel={() => setPending(null)} onConfirm={() => void doImport()} />
      <Confirm open={resetOpen} title="Reset all data?" message="This cannot be undone. Export a backup first." confirmLabel="Delete everything" danger onCancel={() => setResetOpen(false)} onConfirm={async () => { await resetDatabase(); window.location.reload() }} />
    </div>
  )
}
