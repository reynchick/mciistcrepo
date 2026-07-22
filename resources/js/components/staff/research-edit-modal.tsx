import { useEffect, useMemo, useState } from 'react'
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

interface EditResearcher {
  id?: number
  first_name: string
  middle_name?: string
  last_name: string
  email: string
}

interface EditData {
  id: number
  research_title: string
  program_id: number | null
  research_adviser: number | null
  published_month: number | null
  published_year: number | null
  research_abstract: string
  research_approval_sheet: string | null
  research_manuscript: string | null
  researchers: EditResearcher[]
  keyword_names: string[]
  panelist_ids: number[]
  agenda_ids: number[]
  sdg_ids: number[]
  srig_ids: number[]
}

interface Props {
  researchId: number | null
  programs: Program[]
  faculties: FacultyType[]
  keywordOptions: KeywordOption[]
  agendas: ThematicOption[]
  sdgs: ThematicOption[]
  srigs: ThematicOption[]
  onClose: () => void
  onSaved: (title: string) => void
  disableAdviser?: boolean
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EMPTY_RESEARCHER: EditResearcher = { first_name: '', middle_name: '', last_name: '', email: '' }

export default function ResearchEditModal({ researchId, programs, faculties, keywordOptions, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [clientError, setClientError] = useState<string | null>(null)
  // Non-validation failures (500, expired session, network) get their own message
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [programId, setProgramId] = useState<string>('')
  const [adviserId, setAdviserId] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [abstract, setAbstract] = useState('')
  const [researchers, setResearchers] = useState<EditResearcher[]>([])
  const [keywordNames, setKeywordNames] = useState<string[]>([])
  const [panelistIds, setPanelistIds] = useState<number[]>([])
  const [agendaIds, setAgendaIds] = useState<number[]>([])
  const [sdgIds, setSdgIds] = useState<number[]>([])
  const [srigIds, setSrigIds] = useState<number[]>([])
  const [existingApprovalUrl, setExistingApprovalUrl] = useState<string | null>(null)
  const [existingManuscriptUrl, setExistingManuscriptUrl] = useState<string | null>(null)
  const [approvalFile, setApprovalFile] = useState<File | null>(null)
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null)

  const [researcherDraft, setResearcherDraft] = useState<EditResearcher>(EMPTY_RESEARCHER)
  const [editingResearcherIndex, setEditingResearcherIndex] = useState<number | null>(null)
  const [showResearcherForm, setShowResearcherForm] = useState(false)
  const [keywordDraft, setKeywordDraft] = useState('')

  const open = researchId !== null

  useEffect(() => {
    if (!researchId) return
    setLoading(true)
    setLoadError(null)
    setServerErrors({})
    setClientError(null)
    setSubmitError(null)
    fetch(`/research/${researchId}/edit-data`, { headers: { Accept: 'application/json' } })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load research data')
        return r.json()
      })
      .then((json) => {
        const data = json.data as EditData
        setTitle(data.research_title ?? '')
        setProgramId(data.program_id ? String(data.program_id) : '')
        setAdviserId(data.research_adviser ? String(data.research_adviser) : '')
        setMonth(data.published_month ? String(data.published_month) : '')
        setYear(data.published_year ? String(data.published_year) : '')
        setAbstract(data.research_abstract ?? '')
        setResearchers(Array.isArray(data.researchers) ? data.researchers : [])
        setKeywordNames(Array.isArray(data.keyword_names) ? data.keyword_names : [])
        setPanelistIds(Array.isArray(data.panelist_ids) ? data.panelist_ids : [])
        setAgendaIds(Array.isArray(data.agenda_ids) ? data.agenda_ids : [])
        setSdgIds(Array.isArray(data.sdg_ids) ? data.sdg_ids : [])
        setSrigIds(Array.isArray(data.srig_ids) ? data.srig_ids : [])
        setExistingApprovalUrl(data.research_approval_sheet ? `/storage/${data.research_approval_sheet}` : null)
        setExistingManuscriptUrl(data.research_manuscript ? `/storage/${data.research_manuscript}` : null)
        setApprovalFile(null)
        setManuscriptFile(null)
        setShowResearcherForm(false)
        setEditingResearcherIndex(null)
        setResearcherDraft(EMPTY_RESEARCHER)
        setKeywordDraft('')
      })
      .catch((e) => setLoadError(e.message || 'Unable to load research data'))
      .finally(() => setLoading(false))
  }, [researchId])

  const panelistOptions = useMemo(
    () => faculties.filter((f) => String(f.id) !== adviserId),
    [faculties, adviserId],
  )

  const adviserName = useMemo(
    () => adviserId ? faculties.find(f => String(f.id) === adviserId) : null,
    [adviserId, faculties],
  )

  // Laravel keys per-item errors as "researchers.0.email", "keywords.2", etc.
  // Fold them back onto the sections that rendered the data.
  const researcherRowErrors = useMemo(() => {
    const map: Record<number, string[]> = {}
    Object.entries(serverErrors).forEach(([key, message]) => {
      const m = key.match(/^researchers\.(\d+)\./)
      if (m) {
        const idx = Number(m[1])
        if (!map[idx]) map[idx] = []
        map[idx].push(message)
      }
    })
    return map
  }, [serverErrors])

  const keywordItemErrors = useMemo(
    () => Object.entries(serverErrors).filter(([k]) => /^keywords\.\d+$/.test(k)).map(([, m]) => m),
    [serverErrors],
  )

  const panelistErrors = useMemo(
    () => Object.entries(serverErrors).filter(([k]) => /^panelists(\.\d+)?$/.test(k)).map(([, m]) => m),
    [serverErrors],
  )

  const thematicErrors = useMemo(
    () => Object.entries(serverErrors).filter(([k]) => /^(agendas|sdgs|srigs)(\.\d+)?$/.test(k)).map(([, m]) => m),
    [serverErrors],
  )

  // Anything the form has no field slot for still needs to be readable in the banner.
  const unmappedErrors = useMemo(() => {
    const fieldKeys = new Set([
      'research_title', 'program_id', 'research_adviser', 'published_month', 'published_year',
      'research_abstract', 'researchers', 'keywords', 'research_approval_sheet', 'research_manuscript',
    ])
    return Object.entries(serverErrors)
      .filter(([k]) => !fieldKeys.has(k) && !/^researchers\./.test(k) && !/^keywords\.\d+$/.test(k) && !/^panelists(\.\d+)?$/.test(k) && !/^(agendas|sdgs|srigs)(\.\d+)?$/.test(k))
      .map(([, m]) => m)
  }, [serverErrors])

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
    return null
  }

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const error = validate()
    setClientError(error)
    if (error || !researchId) return

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
    }
    if (approvalFile) payload.research_approval_sheet = approvalFile
    if (manuscriptFile) payload.research_manuscript = manuscriptFile

    // Laravel/PHP never parses multipart bodies on PUT requests, so a real PUT
    // here would arrive with an empty body and fail every "required" rule.
    // Spoof the method over POST instead, which PHP parses correctly.
    payload._method = 'put'

    setSubmitting(true)
    setServerErrors({})
    setSubmitError(null)
    // Inertia only invokes onError for validation failures; 500s, expired
    // sessions, and network drops go straight to onFinish. Track whether
    // either callback ran so those failures get an honest message instead
    // of the validation banner.
    let settled = false
    router.post(`/research/${researchId}`, payload, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        settled = true
        onSaved(title.trim())
      },
      onError: (errors) => {
        settled = true
        const errs = (errors ?? {}) as Record<string, string>
        if (Object.keys(errs).length === 0) {
          setSubmitError('Saving failed because of an unexpected server error. Your changes were not saved — please try again.')
        } else {
          setServerErrors(errs)
        }
      },
      onFinish: () => {
        setSubmitting(false)
        if (!settled) {
          setSubmitError('Saving failed — this was not a form validation problem. Your session may have expired or the server hit an error. Refresh the page and try again.')
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Research</DialogTitle>
          <DialogDescription>Update the details of this research entry.</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading research details...
          </div>
        )}

        {loadError && <p className="text-sm text-red-600 py-4">{loadError}</p>}

        {!loading && !loadError && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {(clientError || submitError || Object.keys(serverErrors).length > 0) && (
              <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {clientError ?? submitError ?? (
                  <>
                    <p>Please fix the highlighted errors below and try again.</p>
                    {unmappedErrors.length > 0 && (
                      <ul className="mt-1 list-disc pl-5">
                        {unmappedErrors.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
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
                {disableAdviser ? (
                  <div className="relative">
                    <Input
                      type="text"
                      value={adviserName ? [adviserName.last_name, adviserName.first_name].filter(Boolean).join(', ') : ''}
                      disabled
                      className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    />
                  </div>
                ) : (
                  <Select value={adviserId || '__none'} onValueChange={(v) => setAdviserId(v === '__none' ? '' : v)}>
                    <SelectTrigger aria-invalid={!!serverErrors.research_adviser}><SelectValue placeholder="Select adviser" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">None</SelectItem>
                      {faculties.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>{[f.last_name, f.first_name].filter(Boolean).join(', ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {serverErrors.research_adviser && <p className="text-xs text-red-600">{serverErrors.research_adviser}</p>}
              </div>

              <div className="space-y-2">
                <Label>Published Month</Label>
                <Select value={month || '__none'} onValueChange={(v) => setMonth(v === '__none' ? '' : v)}>
                  <SelectTrigger aria-invalid={!!serverErrors.published_month}><SelectValue placeholder="Select month" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {serverErrors.published_month && <p className="text-xs text-red-600">{serverErrors.published_month}</p>}
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
                    <div key={idx} className="space-y-1">
                      <div className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${researcherRowErrors[idx] ? 'border-red-500 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20' : ''}`}>
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
                      {researcherRowErrors[idx]?.map((message, i) => (
                        <p key={i} className="text-xs text-red-600">{message}</p>
                      ))}
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
              {panelistErrors.map((message, i) => (
                <p key={i} className="text-xs text-red-600">{message}</p>
              ))}
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
              {keywordItemErrors.map((message, i) => (
                <p key={i} className="text-xs text-red-600">{message}</p>
              ))}
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
              {thematicErrors.map((message, i) => (
                <p key={i} className="text-xs text-red-600">{message}</p>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Documents (leave blank to keep current file)</Label>
              <FilesSection
                approvalSheet={approvalFile}
                manuscript={manuscriptFile}
                onChangeApproval={setApprovalFile}
                onChangeManuscript={setManuscriptFile}
                existingApprovalUrl={existingApprovalUrl}
                existingManuscriptUrl={existingManuscriptUrl}
                errorApproval={serverErrors.research_approval_sheet}
                errorManuscript={serverErrors.research_manuscript}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
