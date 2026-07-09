import { AppContent } from '@/components/app-content'
import { AppShell } from '@/components/app-shell'
import { AppSidebar } from '@/components/navigation/app-sidebar'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { router } from '@inertiajs/react'
import { memo, useEffect } from 'react'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
}

function RouterSidebarCloser() {
  const { setOpenMobile } = useSidebar()
  useEffect(() => {
    const unsubStart = router.on('start', () => { setOpenMobile(false) })
    const unsubFinish = router.on('finish', () => {})
    return () => {
      unsubStart()
      unsubFinish()
    }
  }, [setOpenMobile])
  return null
}

function AppLayout({ children, title = '' }: AppLayoutProps) {
  return (
    <AppShell variant="sidebar">
      <AppSidebar />
      <AppContent variant="sidebar" className="overflow-hidden">
        <RouterSidebarCloser />
        {title && (
          <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 lg:px-6 sticky top-0 z-20">
            <SidebarTrigger className="lg:hidden h-11 w-11" aria-label="Open navigation menu" />
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[60vw] lg:max-w-[50%] ml-2" title={title}>{title}</h1>
          </header>
        )}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
        {!title && (
          <div className="lg:hidden fixed bottom-4 left-4 z-30">
            <SidebarTrigger
              className="h-11 w-11 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-lg"
              aria-label="Open navigation menu"
            />
          </div>
        )}
      </AppContent>
    </AppShell>
  )
}

export default memo(AppLayout)
