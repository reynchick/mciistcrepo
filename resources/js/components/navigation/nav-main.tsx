import { SidebarGroup, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { useMemo, useState } from 'react'
import { type MenuItem, type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { usePermissions } from '@/hooks/use-permissions';
import { Activity, FileBarChart, FileText, GraduationCap, LayoutDashboard, Search, TrendingUp, Users, FileEdit, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils'
import { facultyListRoute } from '@/lib/permissions'

const baseMenu: MenuItem[] = [
  { id: 'browse', label: 'Browse Research', icon: Search, route: '/browse', roles: ['Administrator', 'MCIIS Staff', 'Faculty', 'Student'], activePattern: /^\/(browse|staff\/browse|faculty\/browse|student\/browse)/ },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard', roles: ['Administrator', 'MCIIS Staff', 'Faculty'], activePattern: /^\/(dashboard|staff\/dashboard|faculty\/dashboard)/ },
  { id: 'users', label: 'User Management', icon: Users, route: '/users', roles: ['Administrator'], activePattern: /^\/users/ },
  { id: 'manage-research', label: 'Manage Research', icon: FileEdit, route: '/research', roles: ['MCIIS Staff'], activePattern: /^\/(research|staff\/research)/ },
  { id: 'faculty', label: 'View Faculty', icon: GraduationCap, route: '/faculty', roles: ['Administrator', 'MCIIS Staff', 'Faculty', 'Student'], activePattern: /^\/(faculty|staff\/faculty|faculty\/faculty-list|student\/faculty)/ },
  { id: 'my-researches', label: 'My Researches', icon: FolderOpen, route: '/my-researches', roles: ['Faculty'], activePattern: /^\/faculty\/my-researches/ },
  {
    id: 'logs', label: 'View Logs', icon: FileText, route: '/logs/user-audit', roles: ['Administrator'], activePattern: /^\/logs/,
    submenu: [
      { id: 'log-user', label: 'User Audit Logs', icon: Activity, route: '/logs/user-audit', roles: ['Administrator'], activePattern: /^\/logs\/user-audit/ },
      { id: 'log-faculty', label: 'Faculty Audit Logs', icon: Activity, route: '/logs/faculty-audit', roles: ['Administrator'], activePattern: /^\/logs\/faculty-audit/ },
      { id: 'log-entry', label: 'Research Entry Logs', icon: FileText, route: '/logs/research-entry', roles: ['Administrator'], activePattern: /^\/logs\/research-entry/ },
      { id: 'log-access', label: 'Research Access Logs', icon: TrendingUp, route: '/logs/research-access', roles: ['Administrator'], activePattern: /^\/logs\/research-access/ },
      { id: 'log-keyword', label: 'Keyword Search Logs', icon: Search, route: '/logs/keyword-search', roles: ['Administrator'], activePattern: /^\/logs\/keyword-search/ },
    ],
  },
  { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart, route: '/reports', roles: ['Administrator', 'MCIIS Staff'], activePattern: /^\/(reports|staff\/reports)/ },
]

export function NavMain({ items = [] }: { items?: Array<MenuItem | NavItem> }) {
  const page = usePage();
  const { role, isStaff, isFaculty, isStudent } = usePermissions();

  const staffPrefix = (path: string) => (isStaff() ? `/staff${path}` : path)
  const facultyPrefix = (path: string) => (isFaculty() ? `/faculty${path}` : path)
  const studentPrefix = (path: string) => (isStudent() ? `/student${path}` : path)

  const permitted = (item: MenuItem) => {
    const effectiveRole: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student' =
      role === 'Administrator' || role === 'MCIIS Staff' || role === 'Faculty' || role === 'Student'
        ? (role as 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student')
        : 'Student'
    return item.roles.includes(effectiveRole)
  }
  const resolveRoute = (item: MenuItem) => {
    if (item.route === '/dashboard') return isStaff() ? '/staff/dashboard' : item.route
    if (item.id === 'faculty') return facultyListRoute(role)
    if (isStaff() && /^\/(browse|research|faculty|reports)/.test(item.route)) return staffPrefix(item.route)
    if (isFaculty() && /^\/(browse|faculty|my-researches)/.test(item.route)) return facultyPrefix(item.route)
    if (isStudent() && /^\/(browse|faculty)/.test(item.route)) return studentPrefix(item.route)
    return item.route
  }
  const normalize = (arr: Array<MenuItem | NavItem>): MenuItem[] => {
    return arr.map((i) => {
      if ((i as MenuItem).label) return i as MenuItem
      const n = i as NavItem
      const href = typeof n.href === 'string' ? n.href : n.href.url
      return {
        id: (n.title || href).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        label: n.title,
        icon: n.icon as any,
        route: href,
        roles: ['Administrator', 'MCIIS Staff', 'Faculty', 'Student'],
        activePattern: new RegExp('^' + href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      }
    })
  }
  const source = useMemo(() => (items.length ? normalize(items) : baseMenu), [items])
  const finalItems: MenuItem[] = useMemo(() => source.filter(permitted), [source, role])

  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    source.forEach((i) => {
      if (i.submenu && i.submenu.some((s) => (typeof s.activePattern === 'string' ? page.url.startsWith(s.activePattern) : s.activePattern?.test(page.url) ?? false))) initial[i.id] = true
    })
    return initial
  })

  const toggle = (id: string) => setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  const navigate = (route: string, e?: React.MouseEvent) => {
    if (e && (e.ctrlKey || e.metaKey)) {
      window.open(route, '_blank')
      return
    }
    router.visit(route)
  }

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarMenu>
        {finalItems.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              asChild={true}
              isActive={typeof item.activePattern === 'string' ? page.url.startsWith(item.activePattern) : item.activePattern?.test(page.url) ?? false}
              tooltip={
                isStaff() && item.id === 'dashboard'
                  ? 'Faculty productivity insights'
                  : isFaculty() && item.id === 'dashboard'
                  ? 'My research overview'
                  : isStudent() && item.id === 'browse'
                  ? 'Explore research repository'
                  : isStudent() && item.id === 'faculty'
                  ? 'Faculty directory'
                  : item.label
              }
              className={cn('px-4 py-3 gap-3', (typeof item.activePattern === 'string' ? page.url.startsWith(item.activePattern) : item.activePattern?.test(page.url) ?? false) ? 'border-l-4 border-primary bg-primary/10 text-primary' : 'text-muted-foreground')}
              aria-expanded={item.submenu && item.submenu.length ? !!openIds[item.id] : undefined}
            >
              {item.submenu && item.submenu.length ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggle(item.id) }
                    if (e.key === 'Enter') navigate(resolveRoute(item))
                  }}
                  className="flex w-full items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    {item.icon && <item.icon className="size-5" />}
                    <span className="truncate">
                      {item.label}
                      {item.description ? (<span className="block text-xs text-muted-foreground">{item.description}</span>) : null}
                    </span>
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    {item.badge !== undefined ? (<SidebarMenuBadge>{item.badge}</SidebarMenuBadge>) : null}
                    <SidebarMenuAction asChild>
                      <span>{openIds[item.id] ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</span>
                    </SidebarMenuAction>
                  </span>
                </div>
              ) : (
                <Link href={resolveRoute(item)}>
                  {item.icon && <item.icon className="size-5" />}
                  <span className="truncate">
                    {item.label}
                    {item.description ? (<span className="block text-xs text-muted-foreground">{item.description}</span>) : null}
                  </span>
                  {item.badge !== undefined ? (<SidebarMenuBadge className="ml-auto">{item.badge}</SidebarMenuBadge>) : null}
                </Link>
              )}
            </SidebarMenuButton>

            {isStaff() && item.id === 'manage-research' ? (
              <SidebarMenuBadge className="bg-muted text-muted-foreground">Staff</SidebarMenuBadge>
            ) : null}

            {item.submenu && item.submenu.length ? (
              <SidebarMenuSub>
                <div className={cn('grid transition-all', openIds[item.id] ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                  <div className="overflow-hidden">
                    {item.submenu.filter(permitted).map((sub) => (
                      <SidebarMenuSubItem key={sub.id}>
                        <SidebarMenuSubButton asChild isActive={typeof sub.activePattern === 'string' ? page.url.startsWith(sub.activePattern) : sub.activePattern?.test(page.url) ?? false}>
                          <Link href={resolveRoute(sub)}>
                            <sub.icon className="size-4" />
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </div>
                </div>
              </SidebarMenuSub>
            ) : null}

          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
