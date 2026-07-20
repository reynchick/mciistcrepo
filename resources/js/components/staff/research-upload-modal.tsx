import { useState } from 'react'
import { router } from '@inertiajs/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Pencil, X } from 'lucide-react'
import type { Faculty as FacultyType } from '@/types'
import ResearcherInput from '@/components/research/researcher-input'
import PanelistSelect from '@/components/research/panelist-select'
import KeywordInput from '@/components/research/keyword-input'
import FilesSection from '@/components/research/research-form/files'
import ThematicSection from '@/components/research/research-form/thematic'

interface Program {
  id: number
  name: string
  code?: string | null
}

interface KeywordOption {
  id: number
  keyword_name: string
}

interface ThematicOption {
  id: number
  name: string
}

interface DraftResearcher {
  first_name: string
  middle_name?: string
  last_name: string
  email: string
}

interface Props {
  open: boolean
  programs: Program[]
  faculties: FacultyType[]
  keywordOptions: KeywordOption[]
  agendas: ThematicOption[]
  sdgs: ThematicOption[]
  srigs: ThematicOption[]
  onClose: () => void
  onCreated: (title: string) => void
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EMPTY_RESEARCHER: DraftResearcher = { first_name: '', middle_name: '', last_name: '', email: '' }

export default function ResearchUploadModal({ open, programs, faculties, keywordOptions, agendas, sdgs, srigs, onClose, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [clientError, setClientError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [programId, setProgramId] = useState<string>('')
  const [adviserId, setAdviserId] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [year, setYear] = useState<string>(String(new Date().getFullYear()))
  const [abstract, setAbstract] = useState('')
  const [researchers, setResearchers] = useState<DraftResearcher[]>([])
  const [keywordNames, setKeywordNames] = useState<string[]>([])
  const [panelistIds, setPanelistIds] = useState<number[]>([])
  const [agendaIds, setAgendaIds] = useState<number[]>([])
  const [sdgIds, setSdgIds] = useState<number[]>([])
  const [srigIds, setSrigIds] = useState<number[]>([])
  const [approvalFile, setApprovalFile] = useState<File | null>(null)
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null)

  const [researcherDraft, setResearcherDraft] = useState<DraftResearcher>(EMPTY_RESEARCHER)
  const [editingResearcherIndex, setEditingResearcherIndex] = useState<number | null>(null)
  const [showResearcherForm, setShowResearcherForm] = useState(false)
  const [keywordDraft, setKeywordDraft] = useState('')

  const resetForm = () => {
    setTitle('')
    setProgramId('')
    setAdviserId('')
    setMonth('')
    setYear(String(new Date().getFullYear()))
    setAbstract('')
    setResearchers([])
    setKeywordNames([])
    setPanelistIds([])
    setAgendaIds([])
    setSdgIds([])
    setSrigIds([])
    setApprovalFile(null)
    setManuscriptFile(null)
    setResearcherDraft(EMPTY_RESEARCHER)
    setEditingResearcherIndex(null)
    setShowResearcherForm(false)
    setKeywordDraft('')
    setServerErrors({})
    setClientError(null)
  }

  const panelistOptions = faculties.filter((f) => String(f.id) !== adviserId)

  const addOrUpdateResearcher = () => {
    setResearchers((prev) => {
      if (editingResearcherIndex !== null) {
        const next = [...prev]
        next[editingResearcherIndex] = researcherDraft
        return next
      }
      return [...prev, researcherDraft]
    })
    setResearcherDraft(EMPTY_RESEARCHER)
    setEditingResearcherIndex(null)
    setShowResearcherForm(false)
  }

  const editResearcherAt = (idx: number) => {
    setResearcherDraft(researchers[idx])
    setEditingResearcherIndex(idx)
    setShowResearcherForm(true)
  }

  const removeResearcherAt = (idx: number) => {
    setResearchers((prev) => prev.filter((_, i) => i !== idx))
    if (editingResearcherIndex === idx) {
      setShowResearcherForm(false)
      setEditingResearcherIndex(null)
      setResearcherDraft(EMPTY_RESEARCHER)
    }
  }

  const addKeyword = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setKeywordNames((prev) => (prev.some((k) => k.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed]))
    setKeywordDraft('')
  }

  const removeKeyword = (value: string) => {
    setKeywordNames((prev) => prev.filter((k) => k !== value))
  }

  const validate = (): string | null => {
    if (!title.trim()) return 'Research title is required.'
    if (!programId) return 'Program is required.'
    if (!year.trim()) return 'Published year is required.'
    if (!abstract.trim()) return 'Abstract is required.'
    if (researchers.length < 1) return 'At least one researcher is required.'
    if (keywordNames.length < 1) return 'At least one keyword is required.'
    if (!approvalFile) return 'The research approval sheet is required.'
    if (!manuscriptFile) return 'The research manuscript is required.'
    return null
  }

  const handleClose = () => {
    if (submitting) return
    resetForm()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const error = validate()
    setClientError(error)
    if (error) return

    const payload: Record<string, unknown> = {
      research_title: title.trim(),
      program_id: programId ? Number(programId) : null,
      research_adviser: adviserId ? Number(adviserId) : null,
      published_month: month ? Number(month) : null,
      published_year: year ? Number(year) : null,
      research_abstract: abstract.trim(),
      researchers,
      keywords: keywordNames,
      panelists: panelistIds,
      agendas: agendaIds,
      sdgs: sdgIds,
      srigs: srigIds,
      research_approval_sheet: approvalFile,
      research_manuscript: manuscriptFile,
    }

    setSubmitting(true)
    setServerErrors({})
    router.post('/research', payload, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        const createdTitle = title.trim()
        resetForm()
        onCreated(createdTitle)
      },
      onError: (errors) => {
        setServerErrors(errors as Record<string, string>)
      },
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Research</DialogTitle>
          <DialogDescription>Add a new research entry to the repository.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(clientError || Object.keys(serverErrors).length > 0) && (
            <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {clientError ?? 'Please fix the highlighted errors and try again.'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Research Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.currentTarget.value)} aria-invalid={!!serverErrors.research_title} />
              {serverErrors.research_title && <p className="text-xs text-red-600">{serverErrors.research_title}</p>}
            </div>

            <div className="space-y-2">
              <Label>Program *</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger aria-invalid={!!serverErrors.program_id}><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.code ? `${p.code} – ${p.name}` : p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {serverErrors.program_id && <p className="text-xs text-red-600">{serverErrors.program_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Adviser</Label>
              <Select value={adviserId || '__none'} onValueChange={(v) => setAdviserId(v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select adviser" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>{[f.last_name, f.first_name].filter(Boolean).join(', ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Published Month</Label>
              <Select value={month || '__none'} onValueChange={(v) => setMonth(v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Published Year *</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.currentTarget.value)} aria-invalid={!!serverErrors.published_year} />
              {serverErrors.published_year && <p className="text-xs text-red-600">{serverErrors.published_year}</p>}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Abstract *</Label>
              <Textarea rows={5} value={abstract} onChange={(e) => setAbstract(e.currentTarget.value)} aria-invalid={!!serverErrors.research_abstract} />
              {serverErrors.research_abstract && <p className="text-xs text-red-600">{serverErrors.research_abstract}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Researchers *</Label>
              {!showResearcherForm && (
                <Button type="button" size="sm" variant="outline" onClick={() => { setResearcherDraft(EMPTY_RESEARCHER); setEditingResearcherIndex(null); setShowResearcherForm(true) }}>
                  Add Researcher
                </Button>
              )}
            </div>

            {researchers.length > 0 && (
              <div className="space-y-2">
                {researchers.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{[r.last_name, r.first_name].filter(Boolean).join(', ')}</span>
                      {r.middle_name ? <span className="text-muted-foreground"> {r.middle_name}</span> : null}
                      {r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => editResearcherAt(idx)} aria-label="Edit researcher"><Pencil className="size-4" /></Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeResearcherAt(idx)} aria-label="Remove researcher"><X className="size-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showResearcherForm && (
              <div className="rounded-md border p-3">
                <ResearcherInput
                  value={researcherDraft}
                  onChange={setResearcherDraft}
                  onSave={addOrUpdateResearcher}
                  onCancel={() => { setShowResearcherForm(false); setEditingResearcherIndex(null); setResearcherDraft(EMPTY_RESEARCHER) }}
                />
              </div>
            )}
            {serverErrors.researchers && <p className="text-xs text-red-600">{serverErrors.researchers}</p>}
          </div>

          <div className="space-y-2">
            <Label>Panelists</Label>
            <PanelistSelect faculties={panelistOptions} selectedIds={panelistIds} onChange={setPanelistIds} />
          </div>

          <div className="space-y-2">
            <Label>Keywords *</Label>
            <KeywordInput suggestions={keywordOptions} value={keywordDraft} onChange={setKeywordDraft} onAdd={addKeyword} />
            {keywordNames.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {keywordNames.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs px-2.5 py-1 border border-gray-200 dark:border-gray-700">
                    {k}
                    <button type="button" onClick={() => removeKeyword(k)} aria-label={`Remove ${k}`}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {serverErrors.keywords && <p className="text-xs text-red-600">{serverErrors.keywords}</p>}
          </div>

          <div className="space-y-2">
            <Label>Thematic Tagging</Label>
            <ThematicSection
              agendas={agendas}
              sdgs={sdgs}
              srigs={srigs}
              selectedAgendas={agendaIds}
              selectedSdgs={sdgIds}
              selectedSrigs={srigIds}
              onChangeAgendas={setAgendaIds}
              onChangeSdgs={setSdgIds}
              onChangeSrigs={setSrigIds}
            />
          </div>

          <div className="space-y-2">
            <Label>Documents *</Label>
            <FilesSection
              approvalSheet={approvalFile}
              manuscript={manuscriptFile}
              onChangeApproval={setApprovalFile}
              onChangeManuscript={setManuscriptFile}
              errorApproval={serverErrors.research_approval_sheet}
              errorManuscript={serverErrors.research_manuscript}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Upload Research
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
