import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import ResearchForm from '@/components/research/research-form'
import type { Faculty, SharedData } from '@/types'
import { usePage } from '@inertiajs/react'

type Props = {
  programs?: Array<{ id: number; name: string }>
  advisers?: Faculty[]
  faculties: Faculty[]
  keywords: Array<{ id: number; keyword_name: string }>
  agendas?: Array<{ id: number; name: string }>
  sdgs?: Array<{ id: number; name: string }>
  srigs?: Array<{ id: number; name: string }>
}

export default function ResearchCreatePage({ faculties, keywords, agendas = [], sdgs = [], srigs = [] }: Props) {
  const { auth } = usePage<SharedData>().props

  return (
    <AppLayout title="Create Research">
      <Head title="Create Research" />
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Research</h1>
          <p className="text-muted-foreground">Create a new research entry for the repository.</p>
        </div>
        <ResearchForm mode="create" faculties={faculties} keywords={keywords} agendas={agendas} sdgs={sdgs} srigs={srigs} />
      </div>
    </AppLayout>
  )
}
