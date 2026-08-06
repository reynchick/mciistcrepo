import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import StatusBadge from '@/components/research/status-badge'
import StatusHistory from '@/components/research/status-history'
import WorkflowActions from '@/components/research/workflow-actions'
import ResearchReadOnlyBanner from '@/components/research/research-read-only-banner'
import type { Research } from '@/types'
import type { ResearchCapabilities, ResearchWorkflow } from '@/types/models'

type Props = {
  research: Research & { status?: string; updated_at?: string; capabilities?: Partial<ResearchCapabilities> }
  capabilities?: Partial<ResearchCapabilities> | null
  workflow?: ResearchWorkflow | null
  postingReadiness?: { ready: boolean; missing: string[] } | null
}

export default function ResearchShowPage({ research, capabilities, workflow, postingReadiness }: Props) {
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

        <ResearchReadOnlyBanner capabilities={capabilities} />
        <WorkflowActions researchId={research.id} status={research.status} capabilities={capabilities} workflow={workflow} postingReadiness={postingReadiness} />
        <StatusHistory researchId={research.id} />
      </div>
    </AppLayout>
  )
}
