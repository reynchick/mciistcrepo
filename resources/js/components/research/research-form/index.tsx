import { useEffect, useMemo, useRef, useState } from 'react'
import { router, useForm, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ResearchSaveDecisionModal from '@/components/modals/research-save-decision-modal'
import type { Faculty, SharedData } from '@/types'
import type { ResearchCapabilities, ResearchWorkflow } from '@/types/models'
import BasicInfo from './basic-info'
import ResearchersSection from './researchers'
import KeywordsSection from './keywords'
import PanelistsSection from './panelists'
import FilesSection from './files'
import ThematicSection from './thematic'
import { useResearchCapabilities } from '@/hooks/use-research-capabilities'
import { buildResearchDraftStorageKey, deserializeResearchDraftState, serializeResearchDraftState, useResearchSave } from '@/hooks/use-research-save'

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
  capabilities?: Partial<ResearchCapabilities> | null
  workflow?: ResearchWorkflow | null
  postingReadiness?: { ready: boolean; missing: string[] } | null
}

type ResearchFormCapabilities = Pick<ResearchCapabilities,
  'canEdit' | 'canManageResearchers' | 'canSendInitialInvitations' | 'canUseInvitationSaveDecision' | 'canPost'>

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

export default function ResearchForm({ mode, research, faculties, keywords, agendas = [], sdgs = [], srigs = [], capabilities, workflow, postingReadiness }: ResearchFormProps) {
  const page = usePage<SharedData & { auth?: { user?: { id?: number | null } } }>()
  const capabilityState = useResearchCapabilities(capabilities)
  const effectiveCapabilities = useMemo<ResearchCapabilities & ResearchFormCapabilities>(() => {
    const isReadOnlyStatus = mode === 'edit' && ['submitted', 'posted'].includes(workflow?.status ?? '')
    const collaborationEnabled = workflow?.studentCollaborationEnabled ?? true

    return {
      ...capabilityState,
      canEdit: capabilityState.canEdit || mode === 'create' ? !isReadOnlyStatus : false,
      canManageResearchers: (capabilityState.canManageResearchers || mode === 'create') && collaborationEnabled && !isReadOnlyStatus,
      canSendInitialInvitations: capabilityState.canSendInitialInvitations || mode === 'create' ? collaborationEnabled && !isReadOnlyStatus : false,
      canUseInvitationSaveDecision: capabilityState.canUseInvitationSaveDecision || mode === 'create',
      canPost: capabilityState.canPost || mode === 'create',
      canSubmit: capabilityState.canSubmit || mode === 'create',
      canReturnForRevision: capabilityState.canReturnForRevision,
      canArchive: capabilityState.canArchive,
      canRestore: capabilityState.canRestore,
      canHardDelete: capabilityState.canHardDelete,
      readOnlyReason: capabilityState.readOnlyReason,
    }
  }, [capabilityState, mode, workflow?.status, workflow?.studentCollaborationEnabled])
  const [activeTab, setActiveTab] = useState<'basic' | 'researchers' | 'keywords' | 'panelists' | 'files' | 'thematic'>('basic')
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)
  const saveTimer = useRef<number | null>(null)
  const draftKey = useMemo(() => buildResearchDraftStorageKey({ userId: page.props.auth?.user?.id, researchId: mode === 'edit' ? research?.id : undefined, mode }), [mode, page.props.auth?.user?.id, research?.id])

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return

      const parsed = deserializeResearchDraftState<FormData>(JSON.parse(raw))
      if (parsed.research_title !== undefined) setData('research_title', parsed.research_title ?? '')
      if (parsed.program_id !== undefined) setData('program_id', parsed.program_id ?? undefined)
      if (parsed.research_adviser !== undefined) setData('research_adviser', parsed.research_adviser ?? undefined)
      if (parsed.completed_month !== undefined) setData('completed_month', parsed.completed_month ?? undefined)
      if (parsed.completed_year !== undefined) setData('completed_year', parsed.completed_year ?? undefined)
      if (parsed.research_abstract !== undefined) setData('research_abstract', parsed.research_abstract ?? '')
      if (parsed.updated_at !== undefined) setData('updated_at', parsed.updated_at ?? null)
      if (parsed.researchers !== undefined) setData('researchers', parsed.researchers ?? [])
      if (parsed.keyword_names !== undefined) setData('keyword_names', parsed.keyword_names ?? [])
      if (parsed.agendas !== undefined) setData('agendas', parsed.agendas ?? [])
      if (parsed.sdgs !== undefined) setData('sdgs', parsed.sdgs ?? [])
      if (parsed.srigs !== undefined) setData('srigs', parsed.srigs ?? [])
      if (parsed.panelists !== undefined) setData('panelists', parsed.panelists ?? [])
    } catch { void 0 }
  }, [draftKey, setData])

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        const payload = serializeResearchDraftState({
          research_title: data.research_title ?? '',
          program_id: data.program_id ?? undefined,
          research_adviser: data.research_adviser ?? undefined,
          completed_month: data.completed_month ?? undefined,
          completed_year: data.completed_year ?? undefined,
          research_abstract: data.research_abstract ?? '',
          updated_at: data.updated_at ?? null,
          researchers: data.researchers ?? [],
          keyword_names: data.keyword_names ?? [],
          agendas: data.agendas ?? [],
          sdgs: data.sdgs ?? [],
          srigs: data.srigs ?? [],
          panelists: data.panelists ?? [],
        })
        localStorage.setItem(draftKey, JSON.stringify(payload))
        setDraftSavedAt(Date.now())
      } catch { void 0 }
    }, 600)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [data, draftKey])

  useEffect(() => {
    if (wasSuccessful) {
      try {
        localStorage.removeItem(draftKey)
      } catch { void 0 }
      setDraftSavedAt(null)
    }
  }, [draftKey, wasSuccessful])

  const checkTitleUnique = async (title: string) => {
    if (!title?.trim()) return true
    try {
      const r = await fetch(`/research/check-title?title=${encodeURIComponent(title)}`, { headers: { Accept: 'application/json' } })
      if (!r.ok) return true
      const j = await r.json()
      return j?.unique !== false
    } catch { return true }
  }

  const validate = async (allowIncompleteMetadata = false) => {
    const errs: Record<string, string> = {}
    if (!allowIncompleteMetadata) {
      if (!data.research_title?.trim()) errs.research_title = 'Required'
      else {
        const unique = await checkTitleUnique(data.research_title)
        if (!unique) errs.research_title = 'Already exists'
      }
      if (!data.program_id) errs.program_id = 'Required'
      if (!data.research_adviser) errs.research_adviser = 'Required'
      if (!data.research_abstract?.trim()) errs.research_abstract = 'Required'
      if (!Array.isArray(data.researchers) || data.researchers.length < 1) errs.researchers = 'At least one researcher is required'
    }

    const requireEmailValidation = !allowIncompleteMetadata && (effectiveCapabilities.canSendInitialInvitations || mode === 'create')
    const seenEmails = new Set<string>()
    for (const r of data.researchers ?? []) {
      const e = r.email?.trim().toLowerCase()
      if (!e) continue
      if (!requireEmailValidation) continue
      if (!/^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/.test(e)) {
        errs.researchers = 'Use a valid @usep.edu.ph email address'
        break
      }
      if (seenEmails.has(e)) {
        errs.researchers = 'Duplicate emails are not allowed'
        break
      }
      seenEmails.add(e)
    }
    const leadAuthors = (data.researchers ?? []).filter((r) => r.is_lead_author).length
    if (leadAuthors > 1) errs.researchers = 'Only one lead author is allowed'
    if (data.research_adviser && (data.panelists ?? []).includes(data.research_adviser)) {
      errs.panelists = 'Panelist cannot be adviser'
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
    if (data.updated_at) formData.append('updated_at', data.updated_at)

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

  const saveState = useResearchSave({
    researchId: mode === 'edit' ? research?.id : undefined,
    initialUpdatedAt: research?.updated_at ?? null,
    buildFormData: buildSaveFormData,
    onSuccess: async () => {
      try {
        localStorage.removeItem(draftKey)
      } catch { void 0 }
      router.reload({ preserveScroll: true })
    },
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    const allowIncompleteMetadata = workflow?.status === 'draft' || workflow?.isRestoredDraft
    await validate(allowIncompleteMetadata)

    if (mode === 'create') {
      post('/research', {
        forceFormData: true,
        preserveScroll: true,
        onError: (errors) => setClientErrors(errors as Record<string, string>),
      })
      return
    }

    if (!research?.id) return
    await saveState.submit()
  }

  const handleDecision = async (decision: 'save_only' | 'send_invitations') => {
    await saveState.submit(decision)
  }

  const canSubmit = mode === 'create' ? true : (effectiveCapabilities.canEdit || effectiveCapabilities.canManageResearchers || effectiveCapabilities.canSendInitialInvitations || effectiveCapabilities.canPost)
  const submitLabel = mode === 'create' ? 'Create' : workflow?.status === 'draft' || workflow?.isRestoredDraft ? 'Save draft' : 'Save changes'
  const canInviteResearchers = effectiveCapabilities.canSendInitialInvitations && !workflow?.isRestoredDraft && (mode === 'create' || workflow?.status === 'draft' || workflow?.status === 'draft_invited')

  const handleInviteResearchers = async () => {
    clearErrors()
    const allowIncompleteMetadata = workflow?.status === 'draft' || workflow?.isRestoredDraft
    await validate(allowIncompleteMetadata)

    if (!research?.id) return
    await saveState.submit('send_invitations')
  }

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
          {saveState.errorMessage && (
            <div className="text-sm text-red-600">{saveState.errorMessage}</div>
          )}

          {activeTab === 'basic' && (
            <BasicInfo
              data={data}
              setData={setData}
              errors={{ ...errors, ...clientErrors }}
              faculties={faculties}
              onValidateTitle={checkTitleUnique}
              canEdit={effectiveCapabilities.canEdit}
            />
          )}

          {activeTab === 'researchers' && (
            <ResearchersSection
              researchers={(data.researchers as ResearcherInput[]) ?? []}
              setResearchers={(list) => setData('researchers', list)}
              errors={clientErrors.researchers}
              canManage={effectiveCapabilities.canManageResearchers}
              canEdit={effectiveCapabilities.canEdit}
            />
          )}

          {activeTab === 'keywords' && (
            <KeywordsSection
              existingKeywords={keywords}
              keywords={(data.keyword_names ?? []) as string[]}
              setKeywords={(list) => setData('keyword_names', list)}
              error={clientErrors.keyword_names}
              canEdit={effectiveCapabilities.canEdit}
            />
          )}

          {activeTab === 'panelists' && (
            <PanelistsSection
              faculties={faculties}
              adviserId={data.research_adviser}
              panelistIds={data.panelists}
              onChange={(ids) => setData('panelists', ids)}
              canEdit={effectiveCapabilities.canEdit}
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
              canEdit={effectiveCapabilities.canEdit}
            />
          )}

          {activeTab === 'thematic' && (effectiveCapabilities.canEdit || effectiveCapabilities.canPost) && (
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
              canEdit={effectiveCapabilities.canEdit}
            />
          )}

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {postingReadiness && !postingReadiness.ready && (
                <span>Post is disabled until: {postingReadiness.missing.join(', ')}</span>
              )}
            </div>
            <div className="flex justify-end gap-2">
              {canInviteResearchers && (
                <Button type="button" variant="outline" onClick={handleInviteResearchers} disabled={processing || saveState.isProcessing}>
                  Invite researchers
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => validate()}>Validate</Button>
              <Button type="submit" disabled={!canSubmit || processing || saveState.isProcessing}>{submitLabel}</Button>
            </div>
          </div>
        </form>
      </CardContent>
      <ResearchSaveDecisionModal
        open={saveState.decisionOpen}
        onOpenChange={(open) => {
          if (!open) {
            saveState.setDecisionOpen(false)
            saveState.setDecisionSummary(null)
            saveState.setRemovalOnly(false)
          }
        }}
        summary={saveState.decisionSummary}
        removalOnly={saveState.removalOnly}
        onChoose={handleDecision}
        isLoading={saveState.isProcessing}
        submittedRecord={workflow?.status === 'submitted'}
        restoredDraft={Boolean(workflow?.isRestoredDraft)}
      />
    </Card>
  )
}
