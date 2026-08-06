import { useMemo } from 'react'
import type { ResearchCapabilities } from '@/types/models'

export function useResearchCapabilities(capabilities?: Partial<ResearchCapabilities> | null) {
  return useMemo<ResearchCapabilities>(() => ({
    canView: Boolean(capabilities?.canView),
    canEdit: Boolean(capabilities?.canEdit),
    canManageResearchers: Boolean(capabilities?.canManageResearchers),
    canSendInitialInvitations: Boolean(capabilities?.canSendInitialInvitations),
    canUseInvitationSaveDecision: Boolean(capabilities?.canUseInvitationSaveDecision),
    canSubmit: Boolean(capabilities?.canSubmit),
    canReturnForRevision: Boolean(capabilities?.canReturnForRevision),
    canPost: Boolean(capabilities?.canPost),
    canArchive: Boolean(capabilities?.canArchive),
    canRestore: Boolean(capabilities?.canRestore),
    canHardDelete: Boolean(capabilities?.canHardDelete),
    readOnlyReason: capabilities?.readOnlyReason ?? null,
  }), [capabilities])
}
