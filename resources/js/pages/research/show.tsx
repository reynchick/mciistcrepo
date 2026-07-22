import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import StatusBadge from '@/components/research/status-badge'
import StatusHistory from '@/components/research/status-history'
import WorkflowActions from '@/components/research/workflow-actions'
import type { Research } from '@/types'

type Props = {
  research: Research & { entry_mode?: string; status?: string; updated_at?: string }
}

export default function ResearchShowPage({ research }: Props) {
  return (
    <AppLayout title={research.research_title}>
      <Head title={research.research_title} />
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{research.research_title}</h1>
            <p className="text-muted-foreground">Workflow overview and history</p>
          </div>
          <StatusBadge status={research.status} context="staff_metadata_request" />
        </div>

        <WorkflowActions researchId={research.id} status={research.status} entryMode={research.entry_mode} />
        <StatusHistory researchId={research.id} />
      </div>
    </AppLayout>
  )
}
