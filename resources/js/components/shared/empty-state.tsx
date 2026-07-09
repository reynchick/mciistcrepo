import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Info, LockKeyhole, Search, TriangleAlert } from 'lucide-react'

type Variant = 'no_results' | 'no_data' | 'no_permissions' | 'error'

type Props = {
  title?: string
  description?: string
  variant?: Variant
  icon?: React.ComponentType<{ className?: string }>
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const presets: Record<Variant, { title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  no_results: { title: 'No results', description: 'Try adjusting your search or filters.', icon: Search },
  no_data: { title: 'No data available', description: 'There is no content to display yet.', icon: Info },
  no_permissions: { title: 'Insufficient permissions', description: 'You do not have access to this content.', icon: LockKeyhole },
  error: { title: 'Something went wrong', description: 'Please try again later.', icon: TriangleAlert },
}

export default function EmptyState({ title, description, variant = 'no_data', icon, actionLabel, onAction, className }: Props) {
  const preset = presets[variant]
  const Icon = icon ?? preset.icon
  const finalTitle = title ?? preset.title
  const finalDescription = description ?? preset.description
  return (
    <div className={cn('flex w-full flex-col items-center justify-center rounded-lg border bg-background p-8 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div className="text-base font-medium">{finalTitle}</div>
      <div className="mt-1 text-sm text-muted-foreground">{finalDescription}</div>
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export type { Props as EmptyStateProps, Variant as EmptyStateVariant }
