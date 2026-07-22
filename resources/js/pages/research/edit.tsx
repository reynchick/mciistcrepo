import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import ResearchForm from '@/components/research/research-form'
import type { Faculty } from '@/types'

type Props = {
  research: Record<string, unknown>
  faculties: Faculty[]
  keywords: Array<{ id: number; keyword_name: string }>
  agendas?: Array<{ id: number; name: string }>
  sdgs?: Array<{ id: number; name: string }>
  srigs?: Array<{ id: number; name: string }>
}

export default function ResearchEditPage({ research, faculties, keywords, agendas = [], sdgs = [], srigs = [] }: Props) {
  return (
    <AppLayout title="Edit Research">
      <Head title="Edit Research" />
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Research</h1>
          <p className="text-muted-foreground">Update the research entry and workflow details.</p>
        </div>
        <ResearchForm mode="edit" research={research as never} faculties={faculties} keywords={keywords} agendas={agendas} sdgs={sdgs} srigs={srigs} />
      </div>
    </AppLayout>
  )
}
