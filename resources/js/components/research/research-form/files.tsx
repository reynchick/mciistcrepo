import { useEffect, useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Props = {
  approvalSheet: File | null
  manuscript: File | null
  onChangeApproval: (file: File | null) => void
  onChangeManuscript: (file: File | null) => void
  existingApprovalUrl?: string | null
  existingManuscriptUrl?: string | null
  errorApproval?: string
  errorManuscript?: string
}

export default function FilesSection({ approvalSheet, manuscript, onChangeApproval, onChangeManuscript, existingApprovalUrl, existingManuscriptUrl, errorApproval, errorManuscript }: Props) {
  const [dragA, setDragA] = useState(false)
  const [dragM, setDragM] = useState(false)
  const [previewA, setPreviewA] = useState<string | null>(null)
  const [progressA, setProgressA] = useState<number>(0)
  const [progressM, setProgressM] = useState<number>(0)

  useEffect(() => {
    if (!approvalSheet) {
      setPreviewA(null)
      setProgressA(0)
      return
    }
    const isImage = /^image\/(png|jpeg|jpg)$/i.test(approvalSheet.type)
    if (isImage) {
      const url = URL.createObjectURL(approvalSheet)
      setPreviewA(url)
      let p = 0
      const t = window.setInterval(() => { p = Math.min(100, p + 25); setProgressA(p); if (p === 100) window.clearInterval(t) }, 80)
      return () => { URL.revokeObjectURL(url) }
    } else { setPreviewA(null); setProgressA(100) }
  }, [approvalSheet])

  useEffect(() => { if (manuscript) { let p = 0; const t = window.setInterval(() => { p = Math.min(100, p + 25); setProgressM(p); if (p === 100) window.clearInterval(t) }, 80) } else { setProgressM(0) } }, [manuscript])

  const handleFilesA = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const validType = /^image\/(png|jpeg|jpg)$/i.test(f.type) || f.type === 'application/pdf'
    const validSize = f.type === 'application/pdf' ? f.size <= 20_000_000 : f.size <= 5_000_000
    if (!validType || !validSize) return
    onChangeApproval(f)
  }

  const handleFilesM = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const validType = f.type === 'application/pdf'
    const validSize = f.size <= 20_000_000
    if (!validType || !validSize) return
    onChangeManuscript(f)
  }

  const aName = useMemo(() => approvalSheet?.name ?? null, [approvalSheet])
  const mName = useMemo(() => manuscript?.name ?? null, [manuscript])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label>Approval Sheet</Label>
        <div
          className={`mt-2 rounded-md border border-dashed p-4 ${dragA ? 'bg-accent' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragA(true) }}
          onDragLeave={() => setDragA(false)}
          onDrop={(e) => { e.preventDefault(); setDragA(false); handleFilesA(e.dataTransfer.files) }}
        >
          <div className="flex items-center justify-between">
            <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => handleFilesA(e.currentTarget.files)} />
            {aName && <span className="text-sm text-muted-foreground">{aName}</span>}
          </div>
          {errorApproval && <div className="text-xs text-red-600 mt-2">{errorApproval}</div>}
          <div className="mt-3">
            {previewA ? (
              <img src={previewA} alt="Approval preview" className="max-h-40 rounded" />
            ) : existingApprovalUrl ? (
              <a className="text-sm text-blue-600" href={existingApprovalUrl} target="_blank">View existing</a>
            ) : null}
          </div>
          <div className="h-2 bg-muted rounded mt-3 overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${progressA}%` }} /></div>
          <div className="flex gap-2 mt-3">
            <Button type="button" variant="destructive" onClick={() => onChangeApproval(null)}>Remove</Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">PNG/JPG ≤ 5MB or PDF ≤ 20MB</div>
        </div>
      </div>

      <div>
        <Label>Manuscript</Label>
        <div
          className={`mt-2 rounded-md border border-dashed p-4 ${dragM ? 'bg-accent' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragM(true) }}
          onDragLeave={() => setDragM(false)}
          onDrop={(e) => { e.preventDefault(); setDragM(false); handleFilesM(e.dataTransfer.files) }}
        >
          <div className="flex items-center justify-between">
            <input type="file" accept="application/pdf" onChange={(e) => handleFilesM(e.currentTarget.files)} />
            {mName && <span className="text-sm text-muted-foreground">{mName}</span>}
          </div>
          {errorManuscript && <div className="text-xs text-red-600 mt-2">{errorManuscript}</div>}
          <div className="mt-3">
            {existingManuscriptUrl && <a className="text-sm text-blue-600" href={existingManuscriptUrl} target="_blank">View existing</a>}
          </div>
          <div className="h-2 bg-muted rounded mt-3 overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${progressM}%` }} /></div>
          <div className="flex gap-2 mt-3">
            <Button type="button" variant="destructive" onClick={() => onChangeManuscript(null)}>Remove</Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">PDF ≤ 20MB</div>
        </div>
      </div>
    </div>
  )
}
