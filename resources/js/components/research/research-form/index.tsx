import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ResearchSaveDecisionModal from '@/components/modals/research-save-decision-modal'
import type { SharedData, Faculty } from '@/types'
import BasicInfo from './basic-info'
import ResearchersSection from './researchers'
import KeywordsSection from './keywords'
import PanelistsSection from './panelists'
import FilesSection from './files'
import ThematicSection from './thematic'

type Keyword = { id: number; keyword_name: string }
type Option = { id: number; name: string }

type ExistingResearch = Partial<FormData> & {
  id?: number
  updated_at?: string | null
  keywords?: { keyword_name: string }[]
  researchers?: ResearcherInput[]
  agendas?: { id: number }[]
  sdgs?: { id: number }[]
  srigs?: { id: number }[]
  panelists?: { id: number }[]
  research_approval_sheet?: string | null
  research_manuscript?: string | null
}

type ResearchFormProps = {
  mode: 'create' | 'edit'
  research?: ExistingResearch
  faculties: Faculty[]
  keywords: Keyword[]
  agendas?: Option[]
  sdgs?: Option[]
  srigs?: Option[]
}

type ResearcherInput = {
  id?: number
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  is_lead_author?: boolean
}

type FormData = {
  research_title: string
  program_id?: number
  research_adviser?: number
  completed_month?: number
  completed_year?: number
  research_abstract: string
  updated_at?: string | null
  researchers: ResearcherInput[]
  keyword_names: string[]
  approval_sheet: File | null
  manuscript: File | null
  agendas: number[]
  sdgs: number[]
  srigs: number[]
  panelists: number[]
}

export default function ResearchForm({ mode, research, faculties, keywords, agendas = [], sdgs = [], srigs = [] }: ResearchFormProps) {
  const { auth } = usePage<SharedData>().props
  const [activeTab, setActiveTab] = useState<'basic' | 'researchers' | 'keywords' | 'panelists' | 'files' | 'thematic'>('basic')
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [decisionSummary, setDecisionSummary] = useState<Record<string, unknown> | null>(null)
  const [removalOnly, setRemovalOnly] = useState(false)
  const saveTimer = useRef<number | null>(null)

  const { data, setData, post, put, processing, errors, wasSuccessful, clearErrors } = useForm<FormData>({
    research_title: research?.research_title ?? '',
    program_id: research?.program_id ?? undefined,
    research_adviser: research?.research_adviser ?? undefined,
    completed_month: research?.completed_month ?? undefined,
    completed_year: research?.completed_year ?? new Date().getFullYear(),
    research_abstract: research?.research_abstract ?? '',
    updated_at: research?.updated_at ?? null,
    researchers: Array.isArray(research?.researchers) ? (research?.researchers as ResearcherInput[]) : [],
    keyword_names: Array.isArray(research?.keywords) ? ((research?.keywords as { keyword_name: string }[]).map((k) => k.keyword_name)) : [],
    approval_sheet: null as File | null,
    manuscript: null as File | null,
    agendas: Array.isArray(research?.agendas) ? ((research?.agendas as { id: number }[]).map((x) => x.id)) : [],
    sdgs: Array.isArray(research?.sdgs) ? ((research?.sdgs as { id: number }[]).map((x) => x.id)) : [],
    srigs: Array.isArray(research?.srigs) ? ((research?.srigs as { id: number }[]).map((x) => x.id)) : [],
    panelists: Array.isArray(research?.panelists) ? (research?.panelists as { id: number }[]).map((x) => x.id) : [],
  })

  const key = useMemo(() => `research-form:${mode}:${research?.id ?? 'new'}`, [mode, research?.id])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        setData(parsed)
      }
    } catch { void 0 }
  }, [key])

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
        setDraftSavedAt(Date.now())
      } catch { void 0 }
    }, 600)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [data, key])

  useEffect(() => {
    if (wasSuccessful) {
      try {
        localStorage.removeItem(key)
      } catch { void 0 }
      setDraftSavedAt(null)
    }
  }, [wasSuccessful, key])

  const checkTitleUnique = async (title: string) => {
    if (!title?.trim()) return true
    try {
      const r = await fetch(`/research/check-title?title=${encodeURIComponent(title)}`, { headers: { Accept: 'application/json' } })
      if (!r.ok) return true
      const j = await r.json()
      return j?.unique !== false
    } catch { return true }
  }

  const validate = async () => {
    const errs: Record<string, string> = {}
    if (!data.research_title?.trim()) errs.research_title = 'Required'
    else {
      const unique = await checkTitleUnique(data.research_title)
      if (!unique) errs.research_title = 'Already exists'
    }
    if (!data.program_id) errs.program_id = 'Required'
    if (!data.research_adviser) errs.research_adviser = 'Required'
    if (!data.research_abstract?.trim()) errs.research_abstract = 'Required'
    if (!Array.isArray(data.researchers) || data.researchers.length < 1) errs.researchers = 'At least one'
    const emails = new Set<string>()
    for (const r of data.researchers) {
      const e = r.email?.toLowerCase()
      if (!e || !/^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/.test(e)) {
        errs.researchers = 'Invalid emails'
        break
      }
      if (emails.has(e)) {
        errs.researchers = 'Duplicate emails'
        break
      }
      emails.add(e)
    }
    const kw = (data.keyword_names ?? []).filter((x) => x && x.trim())
    if (kw.length < 3) errs.keyword_names = 'Add at least 3'
    const leadAuthors = (data.researchers ?? []).filter((r) => r.is_lead_author).length
    if (leadAuthors > 1) errs.researchers = 'Only one lead author is allowed'
    if (data.research_adviser && (data.panelists ?? []).includes(data.research_adviser)) {
      errs.panelists = 'Panelist cannot be adviser'
    }
    if (mode === 'create') {
      if (!data.approval_sheet) errs.approval_sheet = 'Required'
      if (!data.manuscript) errs.manuscript = 'Required'
    }
    setClientErrors(errs)
    return Object.keys(errs).length === 0
  }

  const progress = useMemo(() => {
    let done = 0
    if (data.research_title?.trim()) done += 1
    if (data.program_id) done += 1
    if (data.research_adviser) done += 1
    if (Array.isArray(data.researchers) && data.researchers.length > 0) done += 1
    if ((data.keyword_names ?? []).filter((x) => x && x.trim()).length >= 3) done += 1
    if (data.research_abstract?.trim()) done += 1
    return Math.round((done / 7) * 100)
  }, [data])

  const buildSaveFormData = (decision?: 'save_only' | 'send_invitations') => {
    const formData = new FormData()
    formData.append('_method', 'put')
    if (decision) formData.append('invitation_action', decision)
    if (research?.updated_at) formData.append('updated_at', research.updated_at)

    formData.append('research_title', data.research_title ?? '')
    if (data.program_id) formData.append('program_id', String(data.program_id))
    if (data.research_adviser) formData.append('research_adviser', String(data.research_adviser))
    if (data.completed_month) formData.append('completed_month', String(data.completed_month))
    if (data.completed_year) formData.append('completed_year', String(data.completed_year))
    formData.append('research_abstract', data.research_abstract ?? '')

    (data.researchers ?? []).forEach((researcher, index) => {
      formData.append(`researchers[${index}][id]`, researcher.id ? String(researcher.id) : '')
      formData.append(`researchers[${index}][first_name]`, researcher.first_name ?? '')
      formData.append(`researchers[${index}][middle_name]`, researcher.middle_name ?? '')
      formData.append(`researchers[${index}][last_name]`, researcher.last_name ?? '')
      formData.append(`researchers[${index}][email]`, researcher.email ?? '')
      formData.append(`researchers[${index}][is_lead_author]`, researcher.is_lead_author ? '1' : '0')
    })

    (data.keyword_names ?? []).forEach((keyword, index) => {
      formData.append(`keywords[${index}]`, keyword)
    })

    (data.panelists ?? []).forEach((panelistId, index) => {
      formData.append(`panelists[${index}]`, String(panelistId))
    })

    (data.agendas ?? []).forEach((agendaId, index) => {
      formData.append(`agendas[${index}]`, String(agendaId))
    })

    (data.sdgs ?? []).forEach((sdgId, index) => {
      formData.append(`sdgs[${index}]`, String(sdgId))
    })

    (data.srigs ?? []).forEach((srigId, index) => {
      formData.append(`srigs[${index}]`, String(srigId))
    })

    if (data.approval_sheet) {
      formData.append('research_approval_sheet', data.approval_sheet)
    }
    if (data.manuscript) {
      formData.append('research_manuscript', data.manuscript)
    }

    return formData
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    const ok = await validate()
    if (!ok) return

    if (mode === 'create') {
      post('/research', {
        forceFormData: true,
        preserveScroll: true,
        onError: (errors) => setClientErrors(errors as Record<string, string>),
      })
      return
    }

    if (!research?.id) return

    try {
      const response = await fetch(`/research/${research.id}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: buildSaveFormData(),
      })

      if (response.ok) {
        const json = await response.json().catch(() => null)
        if (json?.invitation_decision_required) {
          setDecisionSummary(json.summary ?? null)
          setRemovalOnly(Boolean(json.removal_only))
          setShowDecisionModal(true)
          return
        }
        window.location.reload()
        return
      }

      const json = await response.json().catch(() => null)
      if (json?.errors?.updated_at) {
        setClientErrors({ updated_at: 'Record updated by another user' })
      }
    } catch {
      setClientErrors({ form: 'Unable to save research right now' })
    }
  }

  const handleDecision = async (decision: 'save_only' | 'send_invitations') => {
    if (!research?.id) return

    try {
      const response = await fetch(`/research/${research.id}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: buildSaveFormData(decision),
      })

      if (response.ok) {
        setShowDecisionModal(false)
        setDecisionSummary(null)
        setRemovalOnly(false)
        window.location.reload()
        return
      }

      const json = await response.json().catch(() => null)
      if (json?.errors?.updated_at) {
        setClientErrors({ updated_at: 'Record updated by another user' })
      }
    } catch {
      setClientErrors({ form: 'Unable to save research right now' })
    }
  }

  const canSubmit = auth?.user?.role === 'MCIIS Staff' || auth?.user?.role === 'Faculty'

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'New Research' : 'Edit Research'}</CardTitle>
        <CardDescription>Complete all required sections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={progress >= 100 ? 'default' : 'secondary'}>{progress}% complete</Badge>
          {draftSavedAt && <span className="text-xs text-muted-foreground">Draft saved</span>}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button type="button" variant={activeTab === 'basic' ? 'default' : 'outline'} onClick={() => setActiveTab('basic')}>Basic Information</Button>
          <Button type="button" variant={activeTab === 'researchers' ? 'default' : 'outline'} onClick={() => setActiveTab('researchers')}>Researchers</Button>
          <Button type="button" variant={activeTab === 'keywords' ? 'default' : 'outline'} onClick={() => setActiveTab('keywords')}>Keywords</Button>
          <Button type="button" variant={activeTab === 'panelists' ? 'default' : 'outline'} onClick={() => setActiveTab('panelists')}>Panelists</Button>
          <Button type="button" variant={activeTab === 'files' ? 'default' : 'outline'} onClick={() => setActiveTab('files')}>Files</Button>
          <Button type="button" variant={activeTab === 'thematic' ? 'default' : 'outline'} onClick={() => setActiveTab('thematic')}>Thematic</Button>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {Object.values(errors).length > 0 && (
            <div className="text-sm text-red-600">Fix the errors before submitting</div>
          )}
          {Object.values(clientErrors).length > 0 && (
            <div className="text-sm text-red-600">Check required fields</div>
          )}

          {activeTab === 'basic' && (
            <BasicInfo
              data={data}
              setData={setData}
              errors={{ ...errors, ...clientErrors }}
              faculties={faculties}
              onValidateTitle={checkTitleUnique}
            />
          )}

          {activeTab === 'researchers' && (
            <ResearchersSection
              researchers={(data.researchers as ResearcherInput[]) ?? []}
              setResearchers={(list) => setData('researchers', list)}
              errors={clientErrors.researchers}
            />
          )}

          {activeTab === 'keywords' && (
            <KeywordsSection
              existingKeywords={keywords}
              keywords={(data.keyword_names ?? []) as string[]}
              setKeywords={(list) => setData('keyword_names', list)}
              error={clientErrors.keyword_names}
            />
          )}

          {activeTab === 'panelists' && (
            <PanelistsSection
              faculties={faculties}
              adviserId={data.research_adviser}
              panelistIds={data.panelists}
              onChange={(ids) => setData('panelists', ids)}
            />
          )}

          {activeTab === 'files' && (
            <FilesSection
              approvalSheet={data.approval_sheet}
              manuscript={data.manuscript}
              onChangeApproval={(f) => setData('approval_sheet', f)}
              onChangeManuscript={(f) => setData('manuscript', f)}
              existingApprovalUrl={research?.research_approval_sheet && research?.id ? `/research/${research.id}/approval-sheet` : null}
              existingManuscriptUrl={research?.research_manuscript && research?.id ? `/research/${research.id}/manuscript` : null}
            />
          )}

          {activeTab === 'thematic' && (auth?.user?.role === 'MCIIS Staff') && (
            <ThematicSection
              agendas={agendas}
              sdgs={sdgs}
              srigs={srigs}
              selectedAgendas={data.agendas}
              selectedSdgs={data.sdgs}
              selectedSrigs={data.srigs}
              onChangeAgendas={(ids) => setData('agendas', ids)}
              onChangeSdgs={(ids) => setData('sdgs', ids)}
              onChangeSrigs={(ids) => setData('srigs', ids)}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => validate()}>Validate</Button>
            <Button type="submit" disabled={!canSubmit || processing}>{mode === 'create' ? 'Create' : 'Update'}</Button>
          </div>
        </form>
      </CardContent>
      <ResearchSaveDecisionModal
        open={showDecisionModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowDecisionModal(false)
            setDecisionSummary(null)
            setRemovalOnly(false)
          }
        }}
        summary={decisionSummary as Record<string, unknown> | null}
        removalOnly={removalOnly}
        onChoose={handleDecision}
      />
    </Card>
  )
}
