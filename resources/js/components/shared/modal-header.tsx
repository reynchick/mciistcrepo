import { cn } from '@/lib/utils'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Variant = 'default' | 'danger' | 'warning'

interface ModalHeaderProps {
  title: string
  variant?: Variant
  icon?: React.ComponentType<{ className?: string }>
}

export default function ModalHeader({
  title,
  variant = 'default',
  icon: Icon,
}: ModalHeaderProps) {
  const variantStyles = {
    default: 'bg-muted text-muted-foreground',
    danger: 'bg-red-100 text-red-600 dark:bg-red-900/30',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  }

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        {Icon && (
          <span
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-full',
              variantStyles[variant]
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
        {title}
      </DialogTitle>
    </DialogHeader>
  )
}
