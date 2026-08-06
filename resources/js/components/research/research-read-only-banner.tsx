import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ResearchCapabilities } from '@/types/models'
import { useResearchCapabilities } from '@/hooks/use-research-capabilities'

type Props = {
  capabilities?: Partial<ResearchCapabilities> | null
}

export default function ResearchReadOnlyBanner({ capabilities }: Props) {
  const capabilityState = useResearchCapabilities(capabilities)

  if (capabilityState.canEdit || !capabilityState.readOnlyReason) {
    return null
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-900">
      <AlertTitle>Read-only workflow</AlertTitle>
      <AlertDescription>{capabilityState.readOnlyReason}</AlertDescription>
    </Alert>
  )
}
