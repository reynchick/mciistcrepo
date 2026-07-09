import { NavMain } from '@/components/navigation/nav-main'
import { NavUser } from '@/components/navigation/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { type SharedData } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AppLogo from '@/components/app-logo'

interface AppSidebarProps {
  user?: {
    name: string
    email: string
    role: string
    avatar?: string
  }
  isOpen?: boolean
  onClose?: () => void
}

// Let NavMain drive role-aware items via its built-in base menu.

export function AppSidebar(props: AppSidebarProps) {
  const page = usePage<SharedData>()
  const { state, toggleSidebar, isMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
        {!isMobile && (
          <div className="mt-2 p-2">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={state === 'expanded' ? 'Collapse navigation' : 'Expand navigation'}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-sidebar-border px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              {state === 'expanded' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="sr-only">Toggle</span>
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
