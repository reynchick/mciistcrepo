import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { getStatusBadgeColor, getStatusLabel } from '@/lib/research-status'
import type { SharedData } from '@/types'
import type { ResearchStatusSharedProps } from '@/lib/research-status'

export function useResearchStatus(status?: string | null, context?: string) {
  const page = usePage<SharedData & ResearchStatusSharedProps>()

  return useMemo(() => {
    const resolved = (status ?? 'draft').toLowerCase()
    return {
      resolved,
      label: getStatusLabel(resolved, context, page.props),
      badgeColor: getStatusBadgeColor(resolved, page.props),
    }
  }, [context, page.props, status])
}
