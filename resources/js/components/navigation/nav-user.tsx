import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useMobileNavigation } from '@/hooks/use-mobile-navigation'
import { Link, router } from '@inertiajs/react'
import { LogOut, Settings } from 'lucide-react'

export function NavUserActions() {
  const cleanup = useMobileNavigation()

  const handleLogout = () => {
    cleanup()
    router.post('/logout')
    router.flushAll()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/settings/profile" onClick={cleanup}>
            <Settings className="size-4" />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <button type="button" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span>Log out</span>
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
