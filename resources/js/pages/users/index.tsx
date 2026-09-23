import { useEffect, useState } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Users,
  UserX,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import UserRoleBadge from '@/components/user/user-role-badge'
import DeleteUserModal from '@/components/user/delete-user-modal'
import SearchBar from '@/components/shared/search-bar'
import { SortSelect } from '@/components/shared/sort-select'
import Pagination from '@/components/shared/pagination'
import UserStatCards, { type AvatarPerson, type StatCardConfig } from '@/components/user/user-stat-cards'
import UserCreateModal from '@/components/user/user-create-modal'
import { cn } from '@/lib/utils'
import { type SharedData, type User, type UserRole } from '@/types'

interface RoleItem {
  role: UserRole
  count: number
}

interface Props {
  users: {
    data: User[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  filters: {
    search?: string
    search_label?: string
    role?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    status?: 'active' | 'deleted'
  }
  roleDistribution: RoleItem[]
  deletedRoleDistribution: RoleItem[]
  recentRegistrations: number
  totalUsersCount: number
  deletedUsersCount: number
  roles: Array<{ id: number; name: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'; description?: string }>
  adminCount?: number
}

export default function UsersIndex({
  users,
  filters,
  roleDistribution,
  totalUsersCount,
  deletedUsersCount,
  roles,
  adminCount = 1,
}: Props) {
  const { auth } = usePage<SharedData>().props
  const isAdmin = auth.user.roles?.some((role) => role.name === 'Administrator') ?? false

  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Avatar previews for each stat card, keyed by card id ("active", "deleted",
  // "Administrator", ...). This is real component state updated only by the
  // effect below — never recomputed during render — so hovering a card (a
  // pure CSS interaction) can never touch it, and switching to a card whose
  // current page has zero matching users no longer wipes out the other
  // cards' previews. Each key is only ever overwritten when there is new,
  // non-empty data for it; otherwise it just keeps what it already had.
  const [cardPeopleData, setCardPeopleData] = useState<Record<string, AvatarPerson[]>>({})

  const showingDeleted = filters.status === 'deleted'

  /* ----------------------------- data helpers ----------------------------- */

  const getFullName = (user: User) =>
    [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')

  const getInitials = (user: User) =>
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '?'

  const getUserRoles = (user: User): UserRole[] => {
    if (user.roles && user.roles.length > 0) return user.roles.map((r) => r.name as UserRole)
    if (user.role) return [user.role as UserRole]
    return []
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Role cards always show the active-user counts, even while viewing deleted users
  const roleCount = (role: string) =>
    roleDistribution.find((r) => r.role === role)?.count ?? 0

  // "Midnight Sky" palette — cycles every 5 users, then repeats from the top.
  // Color is picked by the user's position in the currently loaded list, so
  // the same user keeps the same circle color everywhere they appear
  // (table row and any stat card avatar stack).
  const CIRCLE_PALETTE = [
    'bg-[#00296B] text-white',
    'bg-[#003F88] text-white',
    'bg-[#00509D] text-white',
    'bg-[#FDC500] text-[#00296B]',
    'bg-[#FFD500] text-[#00296B]',
  ]
  const getCircleTone = (user: User) => {
    const index = users.data.findIndex((u) => u.id === user.id)
    return CIRCLE_PALETTE[(index < 0 ? 0 : index) % CIRCLE_PALETTE.length]
  }

  // Recompute avatar previews only when the underlying data actually changes
  // (a new page of users loaded, or switching active/deleted), and merge
  // additively so a card with zero matches right now keeps showing whatever
  // it last had, instead of blanking out.
  useEffect(() => {
    const buildPeople = (predicate: (user: User) => boolean): AvatarPerson[] =>
      users.data
        .filter(predicate)
        .slice(0, 3)
        .map((user) => ({ initials: getInitials(user), tone: getCircleTone(user) }))

    setCardPeopleData((prev) => {
      const next = { ...prev }

      const activePeople = !showingDeleted ? buildPeople(() => true) : []
      if (activePeople.length > 0) next.active = activePeople

      const deletedPeople = showingDeleted ? buildPeople(() => true) : []
      if (deletedPeople.length > 0) next.deleted = deletedPeople

      // Role cards represent active-user distribution. Keep their previews
      // unchanged while the table is showing deleted users.
      if (!showingDeleted) {
        const roleIds: UserRole[] = ['Administrator', 'Faculty', 'MCIIS Staff', 'Student']
        roleIds.forEach((role) => {
          const people = buildPeople((u) => getUserRoles(u).includes(role))
          if (people.length > 0) next[role] = people
        })
      }

      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.data, showingDeleted])

  const getCardPeople = (cardId: string): AvatarPerson[] => cardPeopleData[cardId] ?? []

  /* ------------------------------- handlers ------------------------------- */

  const handleSearch = (query: string, suggestion?: { id?: number | string; label: string }) => {
    router.get(
      '/users',
      {
        ...filters,
        role: undefined,
        search: suggestion?.id ?? (query || undefined),
        search_label: suggestion?.id ? suggestion.label : undefined,
      },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleRoleFilter = (role: string | undefined) => {
    router.get(
      '/users',
      { ...filters, role, search: undefined, search_label: undefined },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleStatusFilter = (status: 'active' | 'deleted') => {
    router.get(
      '/users',
      {
        ...filters,
        status: status === 'deleted' ? 'deleted' : undefined,
        role: undefined,
        search: undefined,
        search_label: undefined,
      },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleSort = (sort: { key?: string; direction?: 'asc' | 'desc' }) => {
    router.get(
      '/users',
      { ...filters, sort_by: sort.key, sort_order: sort.direction },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleHeaderSort = (key: string) => {
    const direction = filters.sort_by === key && filters.sort_order === 'asc' ? 'desc' : 'asc'
    handleSort({ key, direction })
  }

  const handleRestore = (user: User) => {
    if (restoringId) return
    setRestoringId(user.id)
    router.post(
      `/users/${user.id}/restore`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => setRestoringId(null),
        onError: () => setRestoringId(null),
      }
    )
  }

  /* ------------------------------ stat cards ------------------------------ */

  const activeRole = filters.role

  const statCards: StatCardConfig[] = [
    {
      id: 'active',
      label: 'Active Users',
      value: totalUsersCount,
      icon: Users,
      tone: 'bg-primary/10 text-primary',
      active: !showingDeleted && !activeRole,
      onClick: () => handleStatusFilter('active'),
      people: getCardPeople('active'),
    },
    ...(isAdmin
      ? [
          {
            id: 'deleted',
            label: 'Deleted Users',
            value: deletedUsersCount,
            icon: UserX,
            tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
            active: showingDeleted && !activeRole,
            onClick: () => handleStatusFilter('deleted'),
            people: getCardPeople('deleted'),
          },
        ]
      : []),
    {
      id: 'Administrator',
      label: 'Administrator',
      value: roleCount('Administrator'),
      icon: ShieldCheck,
      tone: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
      active: activeRole === 'Administrator',
      onClick: () => handleRoleFilter(activeRole === 'Administrator' ? undefined : 'Administrator'),
      people: getCardPeople('Administrator'),
    },
    {
      id: 'Faculty',
      label: 'Faculty',
      value: roleCount('Faculty'),
      icon: GraduationCap,
      tone: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
      active: activeRole === 'Faculty',
      onClick: () => handleRoleFilter(activeRole === 'Faculty' ? undefined : 'Faculty'),
      people: getCardPeople('Faculty'),
    },
    {
      id: 'MCIIS Staff',
      label: 'MCIIS Staff',
      value: roleCount('MCIIS Staff'),
      icon: Briefcase,
      tone: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      active: activeRole === 'MCIIS Staff',
      onClick: () => handleRoleFilter(activeRole === 'MCIIS Staff' ? undefined : 'MCIIS Staff'),
      people: getCardPeople('MCIIS Staff'),
    },
    {
      id: 'Student',
      label: 'Student',
      value: roleCount('Student'),
      icon: BookOpen,
      tone: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
      active: activeRole === 'Student',
      onClick: () => handleRoleFilter(activeRole === 'Student' ? undefined : 'Student'),
      people: getCardPeople('Student'),
    },
  ]

  /* ------------------------------ sort options ---------------------------- */

  const sortOptions = showingDeleted
    ? [
        { value: 'deleted_at:desc', label: 'Recently deleted' },
        { value: 'deleted_at:asc', label: 'Oldest deleted' },
        { value: 'first_name:asc', label: 'Name A → Z' },
        { value: 'first_name:desc', label: 'Name Z → A' },
        { value: 'id:asc', label: 'ID ascending' },
        { value: 'id:desc', label: 'ID descending' },
      ]
    : [
        { value: 'created_at:desc', label: 'Newest created' },
        { value: 'created_at:asc', label: 'Oldest created' },
        { value: 'first_name:asc', label: 'Name A → Z' },
        { value: 'first_name:desc', label: 'Name Z → A' },
        { value: 'id:asc', label: 'ID ascending' },
        { value: 'id:desc', label: 'ID descending' },
      ]

  /* --------------------------- table sub-components ----------------------- */

  // Plain (non-sortable) header — used for User / Email, which no longer show sort arrows.
  const PlainHead = ({ label, className }: { label: string; className?: string }) => (
    <TableHead className={cn('font-semibold text-muted-foreground', className)}>{label}</TableHead>
  )

  const SortableHead = ({
    label,
    sortKey,
    className,
    hideIcon = false,
  }: {
    label: string
    sortKey: string
    className?: string
    hideIcon?: boolean
  }) => {
    const isSorted = filters.sort_by === sortKey
    const Icon = !isSorted ? ArrowUpDown : filters.sort_order === 'asc' ? ArrowUp : ArrowDown
    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={() => handleHeaderSort(sortKey)}
          className={cn(
            'inline-flex items-center gap-1 font-semibold transition-colors hover:text-foreground',
            isSorted ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {label}
          {/* hideIcon keeps the Joined/Deleted column clickable for sorting
              without showing the up/down sort arrow glyph */}
          {!hideIcon && <Icon className="h-3 w-3" />}
        </button>
      </TableHead>
    )
  }

  const renderActions = (user: User) => (
    <div className="flex justify-end gap-1">
      {showingDeleted ? (
        <Button
          size="icon"
          variant="ghost"
          // rounded-full + no border/shadow keeps this a plain circular hit
          // area instead of a squared-off button
          className="h-7 w-7 rounded-full border-0 shadow-none text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => handleRestore(user)}
          disabled={restoringId === user.id}
          title="Restore"
        >
          {restoringId === user.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          <span className="sr-only">{restoringId === user.id ? 'Restoring…' : 'Restore'}</span>
        </Button>
      ) : (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full border-0 shadow-none text-muted-foreground hover:bg-muted hover:text-foreground"
            asChild
            title="Edit"
          >
            <Link href={`/users/${user.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only">Edit</span>
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full border-0 shadow-none text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
            onClick={() => setDeleteUser(user)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </>
      )}
    </div>
  )

  /* --------------------------------- render ------------------------------- */

  return (
    <AppLayout>
      <Head title="User Management" />

      <div className="space-y-3 p-3 sm:p-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">User Management</h2>
            <p className="text-sm text-muted-foreground">Manage user accounts, roles and permissions</p>
          </div>

          {isAdmin && (
            <Button className="w-full shrink-0 gap-1.5 sm:w-auto" type="button" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add New User
            </Button>
          )}
        </div>
        <UserCreateModal open={isCreateOpen} onOpenChange={setIsCreateOpen} roles={roles} adminCount={adminCount} />

        {/* Stat cards (also work as filters) — now its own component, see
            @/components/user/user-stat-cards */}
        <UserStatCards cards={statCards} isAdmin={isAdmin} />

        {/* Users table card */}
        <Card className="!mt-0.5 overflow-hidden rounded-lg shadow-xs">
          <CardHeader className="gap-3 border-b bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-base">{showingDeleted ? 'Deleted users' : 'All users'}</CardTitle>
              <CardDescription className="text-xs">
                {users.total === 0 ? 'No users found' : `${users.from}–${users.to} of ${users.total} shown`}
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <SearchBar
                initialValue={filters.search_label || filters.search || ''}
                placeholder="Search by name, email, or ID..."
                onSubmit={(q, suggestion) => handleSearch(q, suggestion)}
                suggestionsEndpoint="/users/suggestions"
                logEndpoint={null}
                className="w-full sm:w-72"
              />
              <SortSelect
                options={sortOptions}
                value={
                  filters.sort_by && filters.sort_order
                    ? `${filters.sort_by}:${filters.sort_order}`
                    : showingDeleted
                      ? 'deleted_at:desc'
                      : 'created_at:desc'
                }
                onChange={(v) => {
                  const [key, direction] = v.split(':') as [string, 'asc' | 'desc']
                  handleSort({ key, direction })
                }}
                className="h-9 border-gray-300 rounded-lg bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                triggerClassName="h-7 border-none bg-transparent px-0 py-0 text-sm text-gray-900 dark:text-gray-100 focus-visible:ring-0"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Keep horizontal scrolling available without showing a scrollbar track. */}
            <div className="table-scroll overflow-x-auto">
              <Table className="w-max min-w-full whitespace-nowrap [&_td]:px-4 [&_th]:px-4">
                <TableHeader>
                  <TableRow className="bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40">
                    <TableHead className="w-16 pl-4 text-muted-foreground">ID</TableHead>
                    <PlainHead label="User" />
                    <PlainHead label="Email" />
                    <TableHead className="text-muted-foreground">Contact</TableHead>
                    <TableHead className="text-muted-foreground">Role(s)</TableHead>
                    <TableHead className="text-muted-foreground">Student/Faculty ID</TableHead>
                    <SortableHead
                      label={showingDeleted ? 'Deleted' : 'Joined'}
                      sortKey={showingDeleted ? 'deleted_at' : 'created_at'}
                      hideIcon
                    />
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    {isAdmin && <TableHead className="pr-4 text-right text-muted-foreground">Actions</TableHead>}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-sm text-muted-foreground">
                        No users match your filters.
                      </TableCell>
                    </TableRow>
                  )}

                  {users.data.map((user) => {
                    const userRoles = getUserRoles(user)
                    const externalId =
                      (userRoles.includes('Student') && user.student_id) ||
                      (userRoles.includes('Faculty') && user.faculty_id) ||
                      null

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/40">
                        {/* ID */}
                        <TableCell className="py-3 pl-4 text-sm text-muted-foreground">{user.id}</TableCell>

                        {/* User */}
                        <TableCell className="py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                                getCircleTone(user)
                              )}
                            >
                              {getInitials(user)}
                            </div>
                            <p className="truncate text-sm font-medium">{getFullName(user)}</p>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="truncate text-sm">
                          {user.email}
                        </TableCell>

                        {/* Contact */}
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {user.contact_number || 'N/A'}
                        </TableCell>

                        {/* Roles */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userRoles.map((roleName) => (
                              <UserRoleBadge key={roleName} role={roleName} size="xs" />
                            ))}
                          </div>
                        </TableCell>

                        {/* Student / Faculty ID */}
                        <TableCell>
                          {externalId ? (
                            <Badge variant="secondary" className="text-xs">
                              {externalId}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>

                        {/* Joined / Deleted date */}
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(
                            showingDeleted
                              ? (user as User & { deleted_at?: string }).deleted_at
                              : user.created_at
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'border-0 text-[11px] font-medium',
                              showingDeleted
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            )}
                          >
                            {showingDeleted ? 'Deleted' : 'Active'}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        {isAdmin && <TableCell className="pr-4">{renderActions(user)}</TableCell>}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {users.last_page > 1 && (
          <Pagination
            meta={{
              current_page: users.current_page,
              last_page: users.last_page,
              per_page: users.per_page,
              total: users.total,
              from: users.from,
              to: users.to,
            }}
            onChange={(page, perPage) => {
              const params = new URLSearchParams()
              if (filters.search) params.set('search', filters.search)
              if (filters.search_label) params.set('search_label', filters.search_label)
              if (filters.role) params.set('role', filters.role)
              if (filters.status) params.set('status', filters.status)
              if (filters.sort_by) params.set('sort_by', filters.sort_by)
              if (filters.sort_order) params.set('sort_order', filters.sort_order)
              params.set('page', String(page))
              params.set('per_page', String(perPage ?? users.per_page))
              router.get(`/users?${params.toString()}`, {}, { preserveScroll: false })
            }}
            perPageOptions={[15, 25, 50, 100]}
            preserveScroll={false}
          />
        )}
      </div>

      {/* Delete User Modal */}
      {deleteUser && (
        <DeleteUserModal
          open={!!deleteUser}
          onOpenChange={(open) => !open && setDeleteUser(null)}
          user={deleteUser}
          onDeleted={() => {
            setDeleteUser(null)
            router.reload()
          }}
        />
      )}
    </AppLayout>
  )
}