import type { Research } from '@/types'

export type ResearchStatus = 'draft' | 'submitted' | 'returned' | 'posted' | 'archived'

export type ResearchCapabilities = {
  canView: boolean
  canEdit: boolean
  canManageResearchers: boolean
  canSubmit: boolean
  canReturnForRevision: boolean
  canPost: boolean
  canArchive: boolean
  canRestore: boolean
  canHardDelete: boolean
  isLinkedStudent?: boolean
  isStaff?: boolean
  readOnlyReason?: string | null
}

export type ResearchWorkflow = {
  status?: ResearchStatus | null
  isRestoredDraft?: boolean
  postingReadiness?: {
    ready: boolean
    missing: string[]
  }
}

export type ResearchPageProps = {
  research: Research
  capabilities: ResearchCapabilities
  workflow: ResearchWorkflow
}
