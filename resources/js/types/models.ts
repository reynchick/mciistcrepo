export type ResearchStatus = 'draft' | 'draft_invited' | 'submitted' | 'returned' | 'posted' | 'archived'

export type ResearchCapabilities = {
  canView: boolean
  canEdit: boolean
  canManageResearchers: boolean
  canSendInitialInvitations: boolean
  canUseInvitationSaveDecision: boolean
  canSubmit: boolean
  canReturnForRevision: boolean
  canPost: boolean
  canArchive: boolean
  canRestore: boolean
  canHardDelete: boolean
  readOnlyReason?: string | null
}

export type InvitationSummaryPerson = {
  researcher_id?: number | null
  name: string
  email?: string | null
  old_email?: string | null
  new_email?: string | null
  had_access?: boolean
}

export type ResearcherChangeSummary = {
  added: InvitationSummaryPerson[]
  changed_emails: InvitationSummaryPerson[]
  removed: InvitationSummaryPerson[]
  expired: InvitationSummaryPerson[]
  archive_revoked: InvitationSummaryPerson[]
}

export type SaveDecisionRequired = {
  invitation_decision_required: true
  removal_only: boolean
  summary: ResearcherChangeSummary
}

export type ResearchWorkflow = {
  status?: ResearchStatus | null
  isRestoredDraft?: boolean
  studentCollaborationEnabled?: boolean
  postingReadiness?: {
    ready: boolean
    missing: string[]
  }
}
