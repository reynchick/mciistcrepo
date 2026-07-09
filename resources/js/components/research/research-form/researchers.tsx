import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import ResearcherInput from '@/components/research/researcher-input'

type ResearcherInput = {
  id?: number
  first_name: string
  middle_name?: string
  last_name: string
  email: string
}

type ResearchersProps = {
  researchers: ResearcherInput[]
  setResearchers: (list: ResearcherInput[]) => void
  errors?: string
}

export default function ResearchersSection({ researchers, setResearchers, errors }: ResearchersProps) {
  const [form, setForm] = useState<ResearcherInput>({ first_name: '', middle_name: '', last_name: '', email: '' })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const add = () => {
    const exists = researchers.some((r) => r.email.toLowerCase() === form.email.toLowerCase())
    if (exists) return
    setResearchers([...researchers, { ...form }])
    setForm({ first_name: '', middle_name: '', last_name: '', email: '' })
  }

  const saveEdit = () => {
    if (editingIndex === null) return
    const r = form
    const dup = researchers.some((x, i) => i !== editingIndex && x.email.toLowerCase() === r.email.toLowerCase())
    if (dup) return
    const next = [...researchers]
    next[editingIndex] = { ...r }
    setResearchers(next)
    setEditingIndex(null)
    setForm({ first_name: '', middle_name: '', last_name: '', email: '' })
  }

  const edit = (idx: number) => {
    setEditingIndex(idx)
    setForm({ ...researchers[idx] })
  }

  const remove = (idx: number) => {
    const next = researchers.filter((_, i) => i !== idx)
    setResearchers(next)
  }

  const moveUp = (idx: number) => {
    if (idx <= 0) return
    const next = [...researchers]
    const t = next[idx - 1]
    next[idx - 1] = next[idx]
    next[idx] = t
    setResearchers(next)
  }

  const moveDown = (idx: number) => {
    if (idx >= researchers.length - 1) return
    const next = [...researchers]
    const t = next[idx + 1]
    next[idx + 1] = next[idx]
    next[idx] = t
    setResearchers(next)
  }

  const count = useMemo(() => researchers.length, [researchers])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{count} added</div>
        {errors && <div className="text-sm text-red-600">{errors}</div>}
      </div>

      {editingIndex === null ? (
        <ResearcherInput value={form} onChange={setForm} onSave={add} onCancel={() => setForm({ first_name: '', middle_name: '', last_name: '', email: '' })} />
      ) : (
        <ResearcherInput value={form} onChange={setForm} onSave={saveEdit} onCancel={() => { setEditingIndex(null); setForm({ first_name: '', middle_name: '', last_name: '', email: '' }) }} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {researchers.map((r, idx) => (
          <div key={idx} className="border rounded-md p-3 flex flex-col gap-2">
            <div className="text-sm font-medium">{[r.last_name, r.first_name, r.middle_name].filter(Boolean).join(', ')}</div>
            <div className="text-sm text-muted-foreground">{r.email}</div>
            <div className="flex gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => moveUp(idx)}>Up</Button>
              <Button type="button" variant="outline" onClick={() => moveDown(idx)}>Down</Button>
              <Button type="button" variant="outline" onClick={() => edit(idx)}>Edit</Button>
              <Button type="button" variant="destructive" onClick={() => remove(idx)}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
