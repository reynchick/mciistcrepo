import { router } from '@inertiajs/react'

type Target = 'home' | 'management'

export function useDashboardFilters(target: Target = 'home') {
  const go = (params: Record<string, string | number | undefined>) => {
    const url = target === 'home' ? '/' : '/researches'
    router.get(url, params, { preserveState: true, preserveScroll: true })
  }

  const byProgram = (program: string | number) => go({ program })
  const byYear = (year: string | number) => go({ year })
  const byKeyword = (search: string) => go({ search })

  return { byProgram, byYear, byKeyword }
}