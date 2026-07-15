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

const PDF_TYPE = 'application/pdf'
const MAX_SIZE = 20_000_000
const PDF_ONLY_ERROR = 'Only PDF files are allowed.'

export default function FilesSection({ approvalSheet, manuscript, onChangeApproval, onChangeManuscript, existingApprovalUrl, existingManuscriptUrl, errorApproval, errorManuscript }: Props) {
  const [dragA, setDragA] = useState(false)
  const [dragM, setDragM] = useState(false)
  const [progressA, setProgressA] = useState<number>(0)
  const [progressM, setProgressM] = useState<number>(0)
  const [typeErrorA, setTypeErrorA] = useState<string | null>(null)
  const [typeErrorM, setTypeErrorM] = useState<string | null>(null)

  useEffect(() => {
    if (!approvalSheet) { setProgressA(0); return }
    let p = 0
    const t = window.setInterval(() => { p = Math.min(100, p + 25); setProgressA(p); if (p === 100) window.clearInterval(t) }, 80)
    return () => window.clearInterval(t)
  }, [approvalSheet])

  useEffect(() => {
    if (!manuscript) { setProgressM(0); return }
    let p = 0
    const t = window.setInterval(() => { p = Math.min(100, p + 25); setProgressM(p); if (p === 100) window.clearInterval(t) }, 80)
    return () => window.clearInterval(t)
  }, [manuscript])

  const handleFilesA = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    if (f.type !== PDF_TYPE) { setTypeErrorA(PDF_ONLY_ERROR); return }
    if (f.size > MAX_SIZE) { setTypeErrorA('File is too large. Maximum size is 20MB.'); return }
    setTypeErrorA(null)
    onChangeApproval(f)
  }

  const handleFilesM = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    if (f.type !== PDF_TYPE) { setTypeErrorM(PDF_ONLY_ERROR); return }
    if (f.size > MAX_SIZE) { setTypeErrorM('File is too large. Maximum size is 20MB.'); return }
    setTypeErrorM(null)
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
            <input type="file" accept="application/pdf" onChange={(e) => handleFilesA(e.currentTarget.files)} />
            {aName && <span className="text-sm text-muted-foreground">{aName}</span>}
          </div>
          {(typeErrorA || errorApproval) && <div className="text-xs text-red-600 mt-2">{typeErrorA ?? errorApproval}</div>}
          <div className="mt-3">
            {existingApprovalUrl && <a className="text-sm text-blue-600" href={existingApprovalUrl} target="_blank">View existing</a>}
          </div>
          <div className="h-2 bg-muted rounded mt-3 overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${progressA}%` }} /></div>
          <div className="flex gap-2 mt-3">
            <Button type="button" variant="destructive" onClick={() => { onChangeApproval(null); setTypeErrorA(null) }}>Remove</Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">PDF only, max 20MB</div>
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
          {(typeErrorM || errorManuscript) && <div className="text-xs text-red-600 mt-2">{typeErrorM ?? errorManuscript}</div>}
          <div className="mt-3">
            {existingManuscriptUrl && <a className="text-sm text-blue-600" href={existingManuscriptUrl} target="_blank">View existing</a>}
          </div>
          <div className="h-2 bg-muted rounded mt-3 overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${progressM}%` }} /></div>
          <div className="flex gap-2 mt-3">
            <Button type="button" variant="destructive" onClick={() => { onChangeManuscript(null); setTypeErrorM(null) }}>Remove</Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">PDF ≤ 20MB</div>
        </div>
      </div>
    </div>
  )
}
