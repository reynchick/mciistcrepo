import { useState, useCallback, useRef } from 'react'

export type UnsavedChangesWarningActions = 'leave' | 'stay' | 'idle'

interface UseUnsavedChangesWarningProps {
  isDirty: boolean
  onLeave?: () => void | Promise<void>
}

/**
 * Hook for managing unsaved changes warnings
 * Handles state for showing/hiding the custom modal and navigation flow
 */
export function useUnsavedChangesWarning({ isDirty, onLeave }: UseUnsavedChangesWarningProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const allowNextNavigationRef = useRef(false)

  const handleLeave = useCallback(async () => {
    setIsLoading(true)
    try {
      if (onLeave) {
        await Promise.resolve(onLeave())
      }
    } finally {
      setIsLoading(false)
    }

    if (pendingAction) {
      allowNextNavigationRef.current = true
      pendingAction()
      setPendingAction(null)
    }
    setShowWarning(false)
  }, [onLeave, pendingAction])

  const handleStay = useCallback(() => {
    setShowWarning(false)
    setPendingAction(null)
  }, [])

  const checkAndWarn = useCallback((action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action)
      setShowWarning(true)
      return false
    }
    action()
    return true
  }, [isDirty])

  return {
    showWarning,
    setShowWarning,
    handleLeave,
    handleStay,
    checkAndWarn,
    isLoading,
    setPendingAction,
    allowNextNavigationRef,
  }
}
