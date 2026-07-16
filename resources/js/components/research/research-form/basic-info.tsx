import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Faculty } from '@/types'
import SelectRS from 'react-select'

type BasicInfoModel = {
  research_title?: string
  program_id?: number
  research_adviser?: number
  published_month?: number
  published_year?: number
  research_abstract?: string
}

type BasicInfoProps = {
  data: BasicInfoModel
  setData: (key: string, value: unknown) => void
  errors: Partial<Record<string, string>>
  faculties: Faculty[]
  onValidateTitle: (title: string) => Promise<boolean>
}

const programs = [
  { id: 1, name: 'Bachelor of Science in Information Technology' },
  { id: 2, name: 'Bachelor of Science in Computer Science' },
  { id: 3, name: 'Bachelor of Library and Information Science' },
  { id: 4, name: 'Master of Library and Information Science' },
  { id: 5, name: 'Master in Information Technology' },
]

const months = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) }))

type FacultyOption = { value: number; label: string }

export default function BasicInfo({ data, setData, errors, faculties, onValidateTitle }: BasicInfoProps) {
  const [title, setTitle] = useState<string>(data.research_title ?? '')
  const [titleStatus, setTitleStatus] = useState<'idle' | 'checking' | 'ok' | 'dup'>('idle')

  useEffect(() => {
    const t = window.setTimeout(async () => {
      if (!title?.trim()) return setTitleStatus('idle')
      setTitleStatus('checking')
      const unique = await onValidateTitle(title)
      setTitleStatus(unique ? 'ok' : 'dup')
    }, 600)
    return () => window.clearTimeout(t)
  }, [title, onValidateTitle])

  useEffect(() => {
    setData('research_title', title)
  }, [title])

  const facultyOptions = useMemo<FacultyOption[]>(() => faculties.map((f) => ({ value: f.id, label: [f.last_name, f.first_name].filter(Boolean).join(', ') })), [faculties])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="research_title">Research Title *</Label>
        <Input id="research_title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} aria-invalid={Boolean(errors.research_title)} />
        <div className="text-xs text-muted-foreground">
          {titleStatus === 'checking' && 'Checking...'}
          {titleStatus === 'dup' && 'Title already exists'}
          {errors.research_title && 'Required'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Program *</Label>
          <Select value={data.program_id ? String(data.program_id) : undefined} onValueChange={(v) => setData('program_id', Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.program_id && <div className="text-xs text-red-600">Required</div>}
        </div>

        <div className="space-y-2">
          <Label>Research Adviser *</Label>
          <SelectRS<FacultyOption>
            options={facultyOptions}
            value={facultyOptions.find((o) => o.value === data.research_adviser) ?? null}
            onChange={(opt) => setData('research_adviser', opt ? (opt as FacultyOption).value : undefined)}
            isClearable
            isSearchable
            placeholder="Search adviser"
            classNamePrefix="rs"
          />
          {errors.research_adviser && <div className="text-xs text-red-600">Required</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Completion Month</Label>
          <Select value={data.published_month ? String(data.published_month) : undefined} onValueChange={(v) => setData('published_month', Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Completion Year</Label>
          <Input type="number" value={data.published_year ?? ''} onChange={(e) => setData('published_year', Number(e.currentTarget.value))} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="research_abstract">Research Abstract *</Label>
        <textarea id="research_abstract" className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none" rows={6} value={data.research_abstract ?? ''} onChange={(e) => setData('research_abstract', e.currentTarget.value)} aria-invalid={Boolean(errors.research_abstract)} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{(data.research_abstract ?? '').length} characters</span>
          {errors.research_abstract && <span className="text-red-600">Required</span>}
        </div>
      </div>
    </div>
  )
}
