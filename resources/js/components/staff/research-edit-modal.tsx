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
import { refreshCsrfToken } from '@/lib/csrf'

interface Program {
  id: number
  name: string
  code?: string | null
}

interface KeywordOption {
  id: number
  keyword_name: string
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
  completed_month: number | null
  completed_year: number | null
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
  onClose: () => void
  onSaved: (title: string) => void
  disableAdviser?: boolean
  studentMode?: boolean
  agendas?: Array<{ id: number; name: string }>
  sdgs?: Array<{ id: number; name: string }>
  srigs?: Array<{ id: number; name: string }>
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const EMPTY_RESEARCHER: EditResearcher = { first_name: '', middle_name: '', last_name: '', email: '' }

export default function ResearchEditModal({
  researchId,
  programs,
  faculties,
  keywordOptions,
  onClose,
  onSaved,
  disableAdviser = false,
  studentMode = false,
  agendas = [],
  sdgs = [],
  srigs = [],
}: Props) {
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [clientError, setClientError] = useState<string | null>(null)
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
  const [approvalSheetRemoved, setApprovalSheetRemoved] = useState(false)
  const [manuscriptRemoved, setManuscriptRemoved] = useState(false)

  const [researcherDraft, setResearcherDraft] = useState<EditResearcher>(EMPTY_RESEARCHER)
  const [editingResearcherIndex, setEditingResearcherIndex] = useState<number | null>(null)
  const [showResearcherForm, setShowResearcherForm] = useState(false)
  const [keywordDraft, setKeywordDraft] = useState('')

  const open = researchId !== null

  const canSubmitForReview = useMemo(() => {
    if (!title.trim() || !programId || !year.trim() || !month || !abstract.trim()) return false
    if (
      researchers.length < 1 ||
      researchers.some((researcher) => !researcher.first_name.trim() || !researcher.last_name.trim() || !researcher.email.trim())
    )
      return false
    if (keywordNames.length < 1) return false
    if (panelistIds.length < 1) return false
    if (agendaIds.length < 1) return false
    if (sdgIds.length < 1) return false
    if (srigIds.length < 1) return false
    if (!existingApprovalUrl && !approvalFile) return false
    if (!existingManuscriptUrl && !manuscriptFile) return false
    return true
  }, [title, programId, year, month, abstract, researchers, keywordNames.length, panelistIds.length, agendaIds.length, sdgIds.length, srigIds.length, existingApprovalUrl, approvalFile, existingManuscriptUrl, manuscriptFile])

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
        const approvalVersion = data.research_approval_sheet
          ? `?v=${encodeURIComponent(data.research_approval_sheet)}`
          : ''
        setTitle(data.research_title ?? '')
        setProgramId(data.program_id ? String(data.program_id) : '')
        setAdviserId(data.research_adviser ? String(data.research_adviser) : '')
        setMonth(data.completed_month ? String(data.completed_month) : '')
        setYear(data.completed_year ? String(data.completed_year) : '')
        setAbstract(data.research_abstract ?? '')
        setResearchers(Array.isArray(data.researchers) ? data.researchers : [])
        setKeywordNames(Array.isArray(data.keyword_names) ? data.keyword_names : [])
        setPanelistIds(Array.isArray(data.panelist_ids) ? data.panelist_ids : [])
        setAgendaIds(Array.isArray(data.agenda_ids) ? data.agenda_ids : [])
        setSdgIds(Array.isArray(data.sdg_ids) ? data.sdg_ids : [])
        setSrigIds(Array.isArray(data.srig_ids) ? data.srig_ids : [])
        setExistingApprovalUrl(data.research_approval_sheet ? `/research/${data.id}/approval-sheet` : null)
        setExistingManuscriptUrl(data.research_manuscript ? `/research/${data.id}/manuscript` : null)
        setApprovalFile(null)
        setManuscriptFile(null)
        setApprovalSheetRemoved(false)
        setManuscriptRemoved(false)
        setShowResearcherForm(false)
        setEditingResearcherIndex(null)
        setResearcherDraft(EMPTY_RESEARCHER)
        setKeywordDraft('')
      })
      .catch((e) => setLoadError(e.message || 'Unable to load research data'))
      .finally(() => setLoading(false))
  }, [researchId])

  useEffect(() => {
    if (!open || !studentMode) return

    void refreshCsrfToken()
    const interval = window.setInterval(() => void refreshCsrfToken(), 15 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [open, studentMode])

  const panelistOptions = useMemo(
    () => faculties.filter((faculty) => String(faculty.id) !== adviserId),
    [faculties, adviserId],
  )

  const adviserName = useMemo(
    () => (adviserId ? faculties.find((faculty) => String(faculty.id) === adviserId) : null),
    [adviserId, faculties],
  )

  const researcherRowErrors = useMemo(() => {
    const map: Record<number, string[]> = {}
    Object.entries(serverErrors).forEach(([key, message]) => {
      const match = key.match(/^researchers\.(\d+)\./)
      if (match) {
        const idx = Number(match[1])
        if (!map[idx]) map[idx] = []
        map[idx].push(message)
      }
    })
    return map
  }, [serverErrors])

  const keywordItemErrors = useMemo(
    () => Object.entries(serverErrors).filter(([key]) => /^keywords\.\d+$/.test(key)).map(([, message]) => message),
    [serverErrors],
  )

  const panelistErrors = useMemo(
    () => Object.entries(serverErrors).filter(([key]) => /^panelists(\.\d+)?$/.test(key)).map(([, message]) => message),
    [serverErrors],
  )

  const unmappedErrors = useMemo(() => {
    const fieldKeys = new Set([
      'research_title',
      'program_id',
      'research_adviser',
      'completed_month',
      'completed_year',
      'research_abstract',
      'researchers',
      'keywords',
      'research_approval_sheet',
      'research_manuscript',
    ])

    return Object.entries(serverErrors)
      .filter(
        ([key]) =>
          !fieldKeys.has(key) &&
          !/^researchers\./.test(key) &&
          !/^keywords\.\d+$/.test(key) &&
          !/^panelists(\.\d+)?$/.test(key),
      )
      .map(([, message]) => message)
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

    setKeywordNames((prev) =>
      prev.some((keyword) => keyword.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed],
    )
    setKeywordDraft('')
  }

  const removeKeyword = (value: string) => {
    setKeywordNames((prev) => prev.filter((keyword) => keyword !== value))
  }

  const validate = (action: 'draft' | 'submit'): string | null => {
    if (!title.trim()) return 'Research title is required.'
    if (!programId) return 'Program is required.'
    if (studentMode && action === 'draft') return null
    if (!year.trim()) return 'Completed Year is required.'
    if (!month) return 'Completed Month is required.'
    if (!abstract.trim()) return 'Abstract is required.'
    if (researchers.length < 1) return 'At least one researcher is required.'
    if (
      researchers.some(
        (researcher) => !researcher.first_name.trim() || !researcher.last_name.trim() || !researcher.email.trim(),
      )
    )
      return 'Each researcher needs a first name, last name, and email address.'
    if (keywordNames.length < 1) return 'At least one keyword is required.'
    if (panelistIds.length < 1) return 'At least one panelist is required.'
    if (agendaIds.length < 1) return 'At least one agenda is required.'
    if (sdgIds.length < 1) return 'At least one SDG is required.'
    if (srigIds.length < 1) return 'At least one SRIG is required.'
    if (!existingApprovalUrl && !approvalFile) return 'The research approval sheet is required.'
    if (!existingManuscriptUrl && !manuscriptFile) return 'The research manuscript is required.'
    return null
  }

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent | undefined, action: 'draft' | 'submit' = 'draft') => {
    e?.preventDefault()

    const error = validate(action)
    setClientError(error)
    if (error || !researchId) return

    const refreshedCsrfToken = studentMode ? await refreshCsrfToken() : null
    if (studentMode && !refreshedCsrfToken) {
      setSubmitError('Your session has expired. Refresh this page, then try again.')
      return
    }

    if (studentMode) {
      const formData = new FormData()
      formData.set('_method', 'put')
      formData.set('_token', refreshedCsrfToken!)
      formData.set('research_title', title.trim())
      formData.set('program_id', programId)
      formData.set('research_adviser', adviserId)
      formData.set('completed_month', month)
      formData.set('completed_year', year)
      formData.set('research_abstract', abstract.trim())
      keywordNames.forEach((value) => formData.append('keywords[]', value))
      panelistIds.forEach((value) => formData.append('panelists[]', String(value)))
      agendaIds.forEach((value) => formData.append('agendas[]', String(value)))
      sdgIds.forEach((value) => formData.append('sdgs[]', String(value)))
      srigIds.forEach((value) => formData.append('srigs[]', String(value)))
      if (approvalFile) formData.set('research_approval_sheet', approvalFile)
      if (manuscriptFile) formData.set('research_manuscript', manuscriptFile)

      setSubmitting(true)
      setServerErrors({})
      setSubmitError(null)

      try {
        const saveResponse = await fetch(`/research/${researchId}`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': refreshedCsrfToken!,
          },
          body: formData,
        })

        if (!saveResponse.ok) {
          if (saveResponse.status === 419) {
            setSubmitError('Your session has expired. Refresh this page, then try again.')
          } else {
            const body = await saveResponse.json().catch(() => null) as { errors?: Record<string, string>; message?: string } | null
            if (body?.errors && Object.keys(body.errors).length > 0) setServerErrors(body.errors)
            else setSubmitError(body?.message || 'Saving failed. Please try again.')
          }
          return
        }

        if (action === 'submit') {
          const submitToken = await refreshCsrfToken()
          if (!submitToken) {
            setSubmitError('Your session has expired. Refresh this page, then try again.')
            return
          }

          const submitResponse = await fetch(`/research/${researchId}/submit`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRF-TOKEN': submitToken,
            },
            body: new URLSearchParams({ _token: submitToken }),
          })

          if (!submitResponse.ok) {
            setSubmitError(
              submitResponse.status === 419
                ? 'Your session has expired. Refresh this page, then try again.'
                : 'Submitting for review failed. Please try again.',
            )
            return
          }
        }

        onSaved(title.trim())
      } catch {
        setSubmitError('Saving failed because the request could not complete. Refresh this page, then try again.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    const payload: Record<string, unknown> = {
      research_title: title.trim(),
      program_id: programId ? Number(programId) : null,
      research_adviser: adviserId ? Number(adviserId) : null,
      completed_month: month ? Number(month) : null,
      completed_year: year ? Number(year) : null,
      research_abstract: abstract.trim(),
      keywords: keywordNames,
      panelists: panelistIds,
      agendas: agendaIds,
      sdgs: sdgIds,
      srigs: srigIds,
    }

    // Students cannot edit researcher records, so omit this field entirely.
    // The backend treats its absence as "leave researchers unchanged" and
    // still rejects a direct student request that includes altered data.
    if (!studentMode) payload.researchers = researchers

    if (approvalFile) payload.research_approval_sheet = approvalFile
    if (manuscriptFile) payload.research_manuscript = manuscriptFile
    payload._method = 'put'

    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content
    if (csrfToken) payload._token = csrfToken

    setSubmitting(true)
    setServerErrors({})
    setSubmitError(null)
    let settled = false

    router.post(`/research/${researchId}`, payload, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: async () => {
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
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
            {(clientError || submitError || Object.keys(serverErrors).length > 0) && (
              <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {clientError ?? submitError ?? (
                  <>
                    <p>Please fix the highlighted errors below and try again.</p>
                    {unmappedErrors.length > 0 && (
                      <ul className="mt-1 list-disc pl-5">
                        {unmappedErrors.map((message, index) => (
                          <li key={index}>{message}</li>
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
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={String(program.id)}>
                        {program.code ? `${program.code} – ${program.name}` : program.name}
                      </SelectItem>
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
                  <Select value={adviserId || '__none'} onValueChange={(value) => setAdviserId(value === '__none' ? '' : value)}>
                    <SelectTrigger aria-invalid={!!serverErrors.research_adviser}><SelectValue placeholder="Select adviser" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">None</SelectItem>
                      {faculties.map((faculty) => (
                        <SelectItem key={faculty.id} value={String(faculty.id)}>
                          {[faculty.last_name, faculty.first_name].filter(Boolean).join(', ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {serverErrors.research_adviser && <p className="text-xs text-red-600">{serverErrors.research_adviser}</p>}
              </div>

              <div className="space-y-2">
                <Label>Completed Month</Label>
                <Select value={month || '__none'} onValueChange={(value) => setMonth(value === '__none' ? '' : value)}>
                  <SelectTrigger aria-invalid={!!serverErrors.completed_month}><SelectValue placeholder="Select month" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {MONTHS.map((monthName, index) => (
                      <SelectItem key={monthName} value={String(index + 1)}>{monthName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {serverErrors.completed_month && <p className="text-xs text-red-600">{serverErrors.completed_month}</p>}
              </div>

              <div className="space-y-2">
                <Label>Completed Year *</Label>
                <Input type="number" value={year} onChange={(e) => setYear(e.currentTarget.value)} aria-invalid={!!serverErrors.completed_year} />
                {serverErrors.completed_year && <p className="text-xs text-red-600">{serverErrors.completed_year}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Abstract *</Label>
                <Textarea rows={5} value={abstract} onChange={(e) => setAbstract(e.currentTarget.value)} aria-invalid={!!serverErrors.research_abstract} />
                {serverErrors.research_abstract && <p className="text-xs text-red-600">{serverErrors.research_abstract}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Researcher/s *</Label>
                {!studentMode && !showResearcherForm && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setResearcherDraft(EMPTY_RESEARCHER)
                      setEditingResearcherIndex(null)
                      setShowResearcherForm(true)
                    }}
                  >
                    Add Researcher
                  </Button>
                )}
              </div>

              {researchers.length > 0 && (
                <div className="space-y-2">
                  {researchers.map((researcher, idx) => (
                    <div key={idx} className="space-y-1">
                      <div
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${researcherRowErrors[idx] ? 'border-red-500 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                      >
                        <div>
                          <span className="font-medium">{[researcher.last_name, researcher.first_name].filter(Boolean).join(', ')}</span>
                          {researcher.middle_name ? <span className="text-muted-foreground"> {researcher.middle_name}</span> : null}
                          {researcher.email && <div className="text-xs text-muted-foreground">{researcher.email}</div>}
                        </div>
                        {!studentMode && (
                          <div className="flex items-center gap-1">
                            <Button type="button" size="sm" variant="ghost" onClick={() => editResearcherAt(idx)} aria-label="Edit researcher">
                              <Pencil className="size-4" />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeResearcherAt(idx)} aria-label="Remove researcher">
                              <X className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {researcherRowErrors[idx]?.map((message, index) => (
                        <p key={index} className="text-xs text-red-600">{message}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {!studentMode && showResearcherForm && (
                <div className="rounded-md border p-3">
                  <ResearcherInput
                    value={researcherDraft}
                    onChange={setResearcherDraft}
                    onSave={addOrUpdateResearcher}
                    onCancel={() => {
                      setShowResearcherForm(false)
                      setEditingResearcherIndex(null)
                      setResearcherDraft(EMPTY_RESEARCHER)
                    }}
                  />
                </div>
              )}
              {serverErrors.researchers && <p className="text-xs text-red-600">{serverErrors.researchers}</p>}
            </div>

            <div className="space-y-2">
              <Label>Panelists</Label>
              <PanelistSelect faculties={panelistOptions} selectedIds={panelistIds} onChange={setPanelistIds} />
              {panelistErrors.map((message, index) => (
                <p key={index} className="text-xs text-red-600">{message}</p>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Keywords *</Label>
              <KeywordInput suggestions={keywordOptions} value={keywordDraft} onChange={setKeywordDraft} onAdd={addKeyword} />
              {keywordNames.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {keywordNames.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs px-2.5 py-1 border border-gray-200 dark:border-gray-700"
                    >
                      {keyword}
                      <button type="button" onClick={() => removeKeyword(keyword)} aria-label={`Remove ${keyword}`}>
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {serverErrors.keywords && <p className="text-xs text-red-600">{serverErrors.keywords}</p>}
              {keywordItemErrors.map((message, index) => (
                <p key={index} className="text-xs text-red-600">{message}</p>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Documents (leave blank to keep current file)</Label>
              <FilesSection
                approvalSheet={approvalFile}
                manuscript={manuscriptFile}
                approvalSheetRemoved={approvalSheetRemoved}
                manuscriptRemoved={manuscriptRemoved}
                onChangeApproval={handleApprovalChange}
                onChangeManuscript={handleManuscriptChange}
                onRemoveApproval={() => setApprovalSheetRemoved(true)}
                onRemoveManuscript={() => setManuscriptRemoved(true)}
                existingApprovalUrl={existingApprovalUrl}
                existingManuscriptUrl={existingManuscriptUrl}
                errorApproval={serverErrors.research_approval_sheet}
                errorManuscript={serverErrors.research_manuscript}
              />
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
                canEdit
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" variant={studentMode ? 'outline' : 'default'} disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                {studentMode ? 'Save Draft' : 'Save Changes'}
              </Button>
              {studentMode && (
                <Button type="button" disabled={submitting || !canSubmitForReview} onClick={() => void handleSubmit(undefined, 'submit')}>
                  Submit for Review
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
