import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import ResearcherInput from '@/components/research/researcher-input'

type ResearcherData = {
  id?: number
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  is_lead_author?: boolean
}

type ResearchersProps = {
  researchers: ResearcherData[]
  setResearchers: (list: ResearcherData[]) => void
  errors?: string
  canManage?: boolean
  canEdit?: boolean
}

export default function ResearchersSection({
  researchers,
  setResearchers,
  errors,
  canManage = true,
  canEdit = true,
}: ResearchersProps) {
  const [form, setForm] = useState<ResearcherData>({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    is_lead_author: false,
  })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const resetForm = () => {
    setForm({
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      is_lead_author: false,
    })
  }

  const add = () => {
    const exists = researchers.some(
      (researcher) =>
        researcher.email.toLowerCase() === form.email.toLowerCase(),
    )

    if (exists) return

    const newResearcher = {
      ...form,
      is_lead_author: form.is_lead_author ?? false,
    }

    const next = newResearcher.is_lead_author
      ? researchers.map((researcher) => ({
          ...researcher,
          is_lead_author: false,
        }))
      : [...researchers]

    setResearchers([...next, newResearcher])
    resetForm()
  }

  const saveEdit = () => {
    if (editingIndex === null) return

    const duplicate = researchers.some(
      (researcher, index) =>
        index !== editingIndex &&
        researcher.email.toLowerCase() === form.email.toLowerCase(),
    )

    if (duplicate) return

    const updatedResearcher = {
      ...form,
      is_lead_author: form.is_lead_author ?? false,
    }

    const next = researchers.map((researcher, index) => {
      if (index === editingIndex) {
        return updatedResearcher
      }

      return updatedResearcher.is_lead_author
        ? { ...researcher, is_lead_author: false }
        : researcher
    })

    setResearchers(next)
    setEditingIndex(null)
    resetForm()
  }

  const edit = (idx: number) => {
    setEditingIndex(idx)
    setForm({ ...researchers[idx] })
  }

  const remove = (idx: number) => {
    setResearchers(researchers.filter((_, index) => index !== idx))
  }

  const moveUp = (idx: number) => {
    if (idx <= 0) return

    const next = [...researchers]
    const previous = next[idx - 1]
    next[idx - 1] = next[idx]
    next[idx] = previous

    setResearchers(next)
  }

  const moveDown = (idx: number) => {
    if (idx >= researchers.length - 1) return

    const next = [...researchers]
    const nextResearcher = next[idx + 1]
    next[idx + 1] = next[idx]
    next[idx] = nextResearcher

    setResearchers(next)
  }

  const count = useMemo(() => researchers.length, [researchers])

  const readOnly = !canEdit || !canManage

  const leadCount = useMemo(
    () => researchers.filter((researcher) => researcher.is_lead_author).length,
    [researchers],
  )

  const toggleLead = (idx: number) => {
    const next = researchers.map((researcher, index) => ({
      ...researcher,
      is_lead_author:
        index === idx ? !researcher.is_lead_author : false,
    }))

    setResearchers(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{count} added</div>
        {errors && <div className="text-sm text-red-600">{errors}</div>}
      </div>

      <div className="text-xs text-muted-foreground">
        Optionally select one lead author.
      </div>

      {leadCount > 1 && (
        <div className="text-sm text-red-600">
          Only one lead author is allowed.
        </div>
      )}

      {readOnly ? (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Researcher management is not available for this workflow state.
        </div>
      ) : editingIndex === null ? (
        <ResearcherInput
          value={form}
          onChange={setForm}
          onSave={add}
          onCancel={resetForm}
        />
      ) : (
        <ResearcherInput
          value={form}
          onChange={setForm}
          onSave={saveEdit}
          onCancel={() => {
            setEditingIndex(null)
            resetForm()
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {researchers.map((researcher, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-2 rounded-md border p-3"
          >
            <div className="text-sm font-medium">
              {[researcher.last_name, researcher.first_name, researcher.middle_name]
                .filter(Boolean)
                .join(', ')}
            </div>

            <div className="text-sm text-muted-foreground">
              {researcher.email}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(researcher.is_lead_author)}
                onChange={() => toggleLead(idx)}
                disabled={!canEdit}
              />
              <span>Lead author</span>
            </div>

            {canEdit && canManage ? (
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => moveUp(idx)}>
                  Up
                </Button>
                <Button type="button" variant="outline" onClick={() => moveDown(idx)}>
                  Down
                </Button>
                <Button type="button" variant="outline" onClick={() => edit(idx)}>
                  Edit
                </Button>
                <Button type="button" variant="destructive" onClick={() => remove(idx)}>
                  Remove
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}