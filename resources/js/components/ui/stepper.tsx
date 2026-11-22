import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepperStep = {
  label: string
}

type StepperProps = {
  steps: StepperStep[]
  /** Zero-based index of the current step. */
  currentStep: number
  /** When provided, steps become clickable. */
  onStepChange?: (index: number) => void
  className?: string
}

/**
 * Horizontal numbered stepper: circles joined by a line, label underneath.
 * - Current step: filled blue circle with a soft ring.
 * - Completed steps: filled blue circle with a check, and the line leading to the next step is blue.
 * - Upcoming steps: outlined circle with its number.
 */
export default function Stepper({ steps, currentStep, onStepChange, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full items-start', className)}>
      {steps.map((step, index) => {
        const isCurrent = index === currentStep
        const isDone = index < currentStep
        const isLast = index === steps.length - 1

        return (
          <li key={step.label} className="relative flex flex-1 flex-col items-center">
            {/* Connector to the next step, drawn from this circle's centre to the next one's */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-1/2 top-4 h-0.5 w-full -translate-y-1/2 transition-colors',
                  isDone ? 'bg-[#0047AB]' : 'bg-border',
                )}
              />
            )}

            <button
              type="button"
              disabled={!onStepChange}
              onClick={() => onStepChange?.(index)}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Step ${index + 1}: ${step.label}`}
              className={cn(
                'relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]/40 disabled:cursor-default',
                isCurrent && 'border-[#0047AB] bg-[#0047AB] text-white ring-4 ring-[#0047AB]/15',
                isDone && 'border-[#0047AB] bg-[#0047AB] text-white',
                !isCurrent && !isDone && 'border-border bg-background text-muted-foreground',
              )}
            >
              {isDone ? <Check className="size-4" strokeWidth={3} /> : index + 1}
            </button>

            <span
              className={cn(
                'mt-2 px-1 text-center text-xs transition-colors',
                isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}