import { AppContent } from '@/components/app-content'
import { AppShell } from '@/components/app-shell'
import { AppSidebar } from '@/components/navigation/app-sidebar'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import AppLogo from '@/components/app-logo'
import { Link, router, usePage } from '@inertiajs/react'
import { Fragment, memo, useEffect } from 'react'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  /** Guests get this true — hides the app nav sidebar entirely. */
  hideSidebar?: boolean
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

function AppLayout({ children, title = '', hideSidebar = false }: AppLayoutProps) {
  const { url } = usePage()
  const pageTitle = getPageTitle(title, url)
  const breadcrumbs = getBreadcrumbs(pageTitle, url, hideSidebar)

  return (
    <AppShell variant="sidebar">
      {!hideSidebar && <AppSidebar />}
      <AppContent variant="sidebar" className="min-w-0 bg-slate-100">
        <RouterSidebarCloser />
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            {hideSidebar ? (
              /* Guests have no sidebar to minimize, so keep the logo link for them */
              <Link href="/dashboard" className="flex shrink-0 items-center gap-2" aria-label="MCIIS Repository home">
                <AppLogo />
                <span className="hidden text-sm font-semibold tracking-tight text-slate-900 sm:inline">MCIIS Repository</span>
              </Link>
            ) : (
              /* Minimize / expand icon replaces the logo + "MCIIS Repository" text.
                 Visible on every screen size (it was lg:hidden before). */
              <SidebarTrigger className="h-9 w-9 shrink-0" aria-label="Toggle sidebar" />
            )}
            <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-slate-200" />
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap gap-1 overflow-hidden text-sm sm:gap-1.5">
                {breadcrumbs.map((item, index) => (
                  <Fragment key={`${item.label}-${item.href ?? 'current'}`}>
                    {index > 0 && <BreadcrumbSeparator className="text-slate-400" />}
                    <BreadcrumbItem className="min-w-0 shrink">
                      {item.href ? (
                        <BreadcrumbLink asChild className="max-w-40 truncate rounded px-1 py-1 text-slate-500 hover:bg-slate-100 hover:text-blue-700 hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:max-w-56">
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="max-w-48 truncate px-1 py-1 font-medium text-slate-800 sm:max-w-72" title={item.label}>
                          {item.label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 bg-slate-100 px-2 py-2 sm:px-3 sm:py-3">
          {children}
        </div>
      </AppContent>
    </AppShell>
  )
}

function getPageTitle(title: string, url: string) {
  if (title.trim()) return title

  const path = url.split('?')[0]
  const pageTitles: Array<[RegExp, string]> = [
    [/^\/(?:staff\/|faculty\/|student\/)?dashboard(?:\/|$)/, 'Dashboard'],
    [/^\/users(?:\/|$)/, 'User Management'],
    [/^\/admin\/students(?:\/|$)/, 'Student Management'],
    [/^\/admin\/research-alignments(?:\/|$)/, 'Research Alignment Management'],
    [/^\/faculty(?:\/|$)/, 'Faculty'],
    [/^\/(?:staff\/)?research(?:\/|$)/, 'Research'],
    [/^\/(?:staff\/)?reports(?:\/|$)/, 'Reports & Analytics'],
    [/^\/logs(?:\/|$)/, 'Logs'],
    [/^\/settings(?:\/|$)/, 'Settings'],
    [/^\/(?:faculty|staff|student)?\/?access-requests(?:\/|$)/, 'Access Requests'],
    [/^\/(?:staff\/|faculty\/|student\/)?browse(?:\/|$)/, 'Browse Research'],
    [/^\/my-researches(?:\/|$)/, 'My Researches'],
    [/^\/file-access-requests(?:\/|$)/, 'File Access Requests'],
    [/^\/settings\/profile(?:\/|$)/, 'Profile Settings'],
    [/^\/settings\/appearance(?:\/|$)/, 'Appearance Settings'],
  ]

  return pageTitles.find(([pattern]) => pattern.test(path))?.[1] ?? 'MCIIS Repository'
}

interface BreadcrumbEntry {
  label: string
  href?: string
}

function getBreadcrumbs(title: string, url: string, hideSidebar: boolean): BreadcrumbEntry[] {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  const ancestors: BreadcrumbEntry[] = []
  const section = getBreadcrumbSection(path, hideSidebar)

  if (path === '/dashboard' && title !== 'Admin Dashboard') {
    ancestors.push({ label: 'Admin Dashboard', href: '/dashboard' })
  }

  const facultyEdit = path.match(/^\/faculty\/(\d+)\/edit$/)
  const researchEdit = path.match(/^\/research\/(\d+)\/edit$/)

  if (section && section.label !== title) {
    ancestors.push(section)
  }

  if (facultyEdit) {
    const facultyName = title.replace(/^Edit\s+/, '').replace(/\s+-\s+Faculty$/, '')
    ancestors.push({ label: facultyName, href: `/faculty/${facultyEdit[1]}` })
  } else if (researchEdit) {
    ancestors.push({ label: 'Research Details', href: `/research/${researchEdit[1]}` })
  }

  return [...ancestors, { label: title }]
}

function getBreadcrumbSection(path: string, isGuest: boolean): BreadcrumbEntry | undefined {
  if (/^\/admin\/students\/.+/.test(path)) {
    return { label: 'Student Management', href: '/admin/students' }
  }
  if (/^\/admin\/research-alignments\/.+/.test(path)) {
    return { label: 'Research Alignment Management', href: '/admin/research-alignments' }
  }
  if (/^\/users\/.+/.test(path)) {
    return { label: 'User Management', href: '/users' }
  }
  if (/^\/faculty\/(?:create|\d+(?:\/edit)?)$/.test(path)) {
    return { label: 'Faculty', href: '/faculty' }
  }
  if (/^\/research\/(?:create|\d+(?:\/edit|\/details)?)$/.test(path)) {
    return { label: isGuest ? 'Browse Research' : 'Research', href: isGuest ? '/browse' : '/research' }
  }
  if (/^\/file-access-requests\/[^/]+\/review$/.test(path)) {
    return { label: 'File Access Requests', href: '/file-access-requests' }
  }
  if (/^\/logs\/[^/]+\/[^/]+\/(?:details|download)$/.test(path)) {
    return { label: 'Logs', href: '/logs/user-audit' }
  }
  return undefined
}

export default memo(AppLayout)