import { useMemo } from 'react'
import type { ResearchCapabilities } from '@/types/models'

type CapabilityLike = Partial<ResearchCapabilities> & Partial<Record<string, boolean | string | null | undefined>>

export function useResearchCapabilities(capabilities?: CapabilityLike | null) {
  return useMemo<ResearchCapabilities>(() => ({
    canView: Boolean(capabilities?.canView ?? capabilities?.can_view),
    canEdit: Boolean(capabilities?.canEdit ?? capabilities?.can_edit),
    canManageResearchers: Boolean(capabilities?.canManageResearchers ?? capabilities?.can_manage_researchers),
    canSendInitialInvitations: Boolean(capabilities?.canSendInitialInvitations ?? capabilities?.can_send_invitations),
    canUseInvitationSaveDecision: Boolean(capabilities?.canUseInvitationSaveDecision ?? capabilities?.can_use_invitation_save_decision),
    canSubmit: Boolean(capabilities?.canSubmit ?? capabilities?.can_submit),
    canReturnForRevision: Boolean(capabilities?.canReturnForRevision ?? capabilities?.can_return),
    canPost: Boolean(capabilities?.canPost ?? capabilities?.can_publish),
    canArchive: Boolean(capabilities?.canArchive ?? capabilities?.can_archive),
    canRestore: Boolean(capabilities?.canRestore ?? capabilities?.can_restore),
    canHardDelete: Boolean(capabilities?.canHardDelete ?? capabilities?.can_hard_delete),
    readOnlyReason: (capabilities?.readOnlyReason ?? capabilities?.read_only_reason ?? null) as string | null,
  }), [capabilities])
}
