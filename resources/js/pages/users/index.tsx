import { useState, useEffect } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import Heading from '@/components/heading'
import HeadingSmall from '@/components/heading-small'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Plus, Edit, Trash2 } from 'lucide-react'
import UserRoleBadge from '@/components/user/user-role-badge'
import DeleteUserModal from '@/components/user/delete-user-modal'
// import StatCard from '@/components/shared/stat-card'
import SearchBar from '@/components/shared/search-bar'
import { SortSelect } from '@/components/shared/sort-select'
import DataTable, { type DataTableColumn } from '@/components/shared/data-table'
// import { useState as useAccordionState } from 'react'
import Pagination from '@/components/shared/pagination'
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
}

export default function UsersIndex({ users, filters, roleDistribution, deletedRoleDistribution, recentRegistrations, totalUsersCount, deletedUsersCount }: Props) {
  const { auth } = usePage<SharedData>().props
  const isAdmin = auth.user.roles?.some((role) => role.name === 'Administrator') ?? false

  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [restoreUser, setRestoreUser] = useState<User | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  const showingDeleted = filters.status === 'deleted'

  const handleSearch = (query: string, suggestion?: { id?: number | string; label: string }) => {
    // Always reset role filter to 'All' (undefined) when searching
    if (suggestion?.id) {
      router.get('/users', {
        ...filters,
        role: undefined, // Reset role filter
        search: suggestion.id,
        search_label: suggestion.label
      }, { preserveState: true, preserveScroll: true })
    } else {
      router.get('/users', {
        ...filters,
        role: undefined, // Reset role filter
        search: query || undefined,
        search_label: undefined
      }, { preserveState: true, preserveScroll: true })
    }
  }

  const handleClearSearch = () => {
    router.get('/users', { 
      role: undefined,
      search: undefined,
      search_label: undefined
    }, { preserveState: true, preserveScroll: true })
  }

  const handleRoleFilter = (role: string) => {
    router.get('/users', { 
      ...filters, 
      role: role !== 'all' ? role : undefined,
      search: undefined,
      search_label: undefined
    }, { preserveState: true, preserveScroll: true })
  }

  const handleStatusFilter = (status: string) => {
    router.get('/users', { 
      ...filters, 
      status: status !== 'active' ? status : undefined,
      search: undefined,
      search_label: undefined
    }, { preserveState: true, preserveScroll: true })
  }

  const handleRestore = (user: User) => {
    if (restoringId) return
    setRestoringId(user.id)
    router.post(`/users/${user.id}/restore`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setRestoringId(null)
        setRestoreUser(null)
      },
      onError: () => {
        setRestoringId(null)
      }
    })
  }

  const handleSort = (sort: { key?: string; direction?: 'asc' | 'desc' }) => {
    router.get('/users', { ...filters, sort_by: sort.key, sort_order: sort.direction }, { preserveState: true, preserveScroll: true })
  }

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

  const getFullName = (user: User) => {
    const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean)
    return parts.join(' ')
  }

  const getUserRoles = (user: User): UserRole[] => {
    if (user.roles && user.roles.length > 0) {
      return user.roles.map((r) => r.name as UserRole)
    }
    if (user.role) {
      return [user.role as UserRole]
    }
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

  // Responsive columns: desktop, tablet, mobile
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  // Mobile accordion open state (track open user by ID)
  const [openAccordionId, setOpenAccordionId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Segmented Filter Bar roles (All, Administrator, MCIS Staff, Faculty, Student)
  // Use deleted role distribution when viewing deleted users, otherwise use active
  const currentRoleDistribution = showingDeleted ? deletedRoleDistribution : roleDistribution;
  const currentTotalCount = showingDeleted ? deletedUsersCount : totalUsersCount;
  
  const filterRoles = [
    { role: 'all', label: 'All', icon: null, count: currentTotalCount },
    ...currentRoleDistribution.map((item) => ({
      role: item.role,
      label: item.role,
      icon: null, // Could add minimal icons if desired
      count: item.count,
    })),
  ];

  let columns: DataTableColumn<User>[] = [];
  // ...existing code for columns (unchanged)...
  if (windowWidth > 640 && windowWidth <= 1024) {
    columns = [
      {
        key: 'id',
        header: 'ID',
        sortable: true,
        render: (user) => <Badge variant="outline">{user.id}</Badge>,
      },
      {
        key: 'first_name',
        header: 'Full Name',
        sortable: true,
        render: (user) => <div className="font-medium">{getFullName(user)}</div>,
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (user) => <div className="text-sm">{user.email}</div>,
      },
      {
        key: 'roles',
        header: 'Role(s)',
        render: (user) => {
          const userRoles = getUserRoles(user)
          return (
            <div className="flex flex-wrap gap-1">
              {userRoles.map((roleName) => (
                <UserRoleBadge key={roleName} role={roleName} size="xs" />
              ))}
            </div>
          )
        },
      },
    ];
    if (isAdmin) {
      columns.push({
        key: 'actions',
        header: 'Actions',
        render: (user) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/users/${user.id}/edit`}>
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Link>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteUser(user)}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          </div>
        ),
      });
    }
  } else {
    columns = [
      {
        key: 'id',
        header: 'ID',
        sortable: true,
        render: (user) => <Badge variant="outline">{user.id}</Badge>,
      },
      {
        key: 'first_name',
        header: 'Full Name',
        sortable: true,
        render: (user) => <div className="font-medium">{getFullName(user)}</div>,
      },
      {
        key: 'contact_number',
        header: 'Contact',
        render: (user) => <div className="text-sm text-muted-foreground">{user.contact_number || 'N/A'}</div>,
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (user) => <div className="text-sm">{user.email}</div>,
      },
      {
        key: 'roles',
        header: 'Role(s)',
        render: (user) => {
          const userRoles = getUserRoles(user)
          return (
            <div className="flex flex-wrap gap-1">
              {userRoles.map((roleName) => (
                <UserRoleBadge key={roleName} role={roleName} size="xs" />
              ))}
            </div>
          )
        },
      },
      {
        header: 'Student/Faculty ID',
        render: (user) => {
          const userRoles = getUserRoles(user)
          if (userRoles.includes('Student') && user.student_id) {
            return <Badge variant="secondary" className="text-xs">{user.student_id}</Badge>
          }
          if (userRoles.includes('Faculty') && user.faculty_id) {
            return <Badge variant="secondary" className="text-xs">{user.faculty_id}</Badge>
          }
          return <span className="text-sm text-muted-foreground">N/A</span>
        },
      },
      {
        key: 'created_at',
        header: 'Created',
        sortable: true,
        render: (user) => <div className="text-sm text-muted-foreground">{formatDate(user.created_at)}</div>,
      },
    ];
    if (isAdmin) {
      columns.push({
        key: 'actions',
        header: 'Actions',
        render: (user) => (
          <div className="flex justify-end gap-2">
            {showingDeleted ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleRestore(user)}
                disabled={restoringId === user.id}
              >
                {restoringId === user.id ? (
                  <>
                    <span className="mr-1 h-3 w-3 animate-spin">⟳</span>
                    Restoring...
                  </>
                ) : (
                  <>
                    <span className="mr-1">↻</span>
                    Restore
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/users/${user.id}/edit`}>
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteUser(user)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </>
            )}
          </div>
        ),
      });
    }
  }

  return (
    <AppLayout>
      <Head title="User Management" />

      <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading title="User Management" description="Manage user accounts and permissions" />
          </div>
          {isAdmin && (
            <Button asChild>
              <Link href="/users/create">
                <Plus className="mr-2 h-4 w-4" />
                Add New User
              </Link>
            </Button>
          )}
        </div>

        {/* Status Filter: Active vs Deleted */}
        {isAdmin && (
          <div className="flex gap-2 items-center">
            <Button
              variant={!showingDeleted ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('active')}
              className="rounded-full"
            >
              Active Users
              <Badge variant={!showingDeleted ? 'secondary' : 'outline'} className="ml-2">
                {totalUsersCount}
              </Badge>
            </Button>
            <Button
              variant={showingDeleted ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('deleted')}
              className="rounded-full"
            >
              Deleted Users
              <Badge variant={showingDeleted ? 'secondary' : 'outline'} className="ml-2">
                {deletedUsersCount}
              </Badge>
            </Button>
          </div>
        )}

        {/* Role Filter: Dropdown for mobile, segmented bar for tablet/desktop */}
        {windowWidth <= 640 ? (
          <div className="mb-2 w-full">
            <Select value={filters.role ?? 'all'} onValueChange={handleRoleFilter}>
              <SelectTrigger className="w-full rounded-full border border-input bg-background px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary">
                <SelectValue>
                  {(() => {
                    const selected = filterRoles.find(r => (filters.role ?? 'all') === r.role)
                    return selected ? (
                      <span className="flex items-center gap-2">
                        {selected.role !== 'all' && (
                          <UserRoleBadge role={selected.role as UserRole} iconOnly size="xs" className="mr-2" />
                        )}
                        <span>{selected.label}</span>
                        <span className="ml-1 text-muted-foreground">({selected.count})</span>
                      </span>
                    ) : null
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filterRoles.map((item) => (
                  <SelectItem key={item.role} value={item.role} className="flex items-center gap-2">
                    <span className="flex items-center gap-2">
                      {item.role !== 'all' && (
                        <UserRoleBadge role={item.role as UserRole} iconOnly size="xs" className="mr-2" />
                      )}
                      <span>{item.label}</span>
                      <span className="ml-1 text-muted-foreground">({item.count})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div
            className={[
              'mb-2',
              'flex flex-row gap-3',
            ].join(' ')}
            role="tablist"
            aria-label="User role filter tabs"
          >
            {filterRoles.map((item) => {
              const isActive = (filters.role ?? 'all') === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleRoleFilter(item.role)}
                  className={[
                    'flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm min-w-[120px] justify-center',
                    'border-b-2 border-transparent',
                    isActive
                      ? 'border-primary text-primary bg-background'
                      : 'hover:border-primary/60 text-muted-foreground',
                    'focus:outline-none whitespace-nowrap transition',
                  ].join(' ')}
                  style={{ fontWeight: isActive ? 600 : 500 }}
                >
                  {item.role !== 'all' && (
                    <UserRoleBadge role={item.role as UserRole} iconOnly size="xs" className="mr-2" />
                  )}
                  <span>{item.label}</span>
                  <span className={isActive ? 'ml-1 font-bold' : 'ml-1 text-muted-foreground'}>{item.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            initialValue={filters.search_label || filters.search || ""}
            placeholder="Search by name, email, or ID..."
            onSubmit={(q, suggestion) => handleSearch(q, suggestion)}
            suggestionsEndpoint="/users/suggestions"
            logEndpoint={null}
            className="flex-1"
          />

          <div className="flex w-full sm:w-auto gap-3 sm:items-center">
            {/* Sort dropdown */}
            <SortSelect
              options={sortOptions}
              value={filters.sort_by && filters.sort_order ? `${filters.sort_by}:${filters.sort_order}` : showingDeleted ? 'deleted_at:desc' : 'created_at:desc'}
              onChange={(v) => {
                const [key, direction] = v.split(':') as [string, 'asc' | 'desc']
                handleSort({ key, direction })
              }}
              className="h-10"
              triggerClassName="h-8 w-44 text-sm border-0 focus:ring-0"
            />

            {/* Mobile-Only Role Filter Dropdown (removed, replaced by segmented bar) */}
          </div>
        </div>


        {/* User List: Accordion/List for mobile, DataTable for tablet/desktop */}
        {windowWidth <= 640 ? (
          <div className="rounded-xl border border-muted bg-background overflow-hidden divide-y divide-muted-foreground/10">
            {users.data.map((user, idx) => {
              const open = openAccordionId === user.id;
              // For expanded item background
              const expandedBg = open ? 'bg-muted/40' : '';
              return (
                <div
                  key={user.id}
                  className={[
                    'transition-colors',
                    expandedBg,
                    idx === 0 ? 'rounded-t-xl' : '',
                    idx === users.data.length - 1 ? 'rounded-b-xl' : '',
                  ].join(' ')}
                >
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-medium focus:outline-none bg-transparent"
                    onClick={() => setOpenAccordionId(open ? null : user.id)}
                    aria-expanded={open}
                  >
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">{user.id}</Badge>
                      <span className="font-medium">{getFullName(user)}</span>
                    </span>
                    <span className="ml-2 text-muted-foreground">{open ? '▲' : '▼'}</span>
                  </button>
                  {open && (
                    <div className="px-4 pb-3 pt-1 text-sm space-y-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{user.email}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-muted-foreground">Contact:</span>
                        <span>{user.contact_number || 'N/A'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-muted-foreground">Role(s):</span>
                        <span className="flex gap-1">
                          {getUserRoles(user).map((roleName) => (
                            <UserRoleBadge key={roleName} role={roleName} size="xs" />
                          ))}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-muted-foreground">Student/Faculty ID:</span>
                        {getUserRoles(user).includes('Student') && user.student_id && (
                          <Badge variant="secondary" className="text-xs">{user.student_id}</Badge>
                        )}
                        {getUserRoles(user).includes('Faculty') && user.faculty_id && (
                          <Badge variant="secondary" className="text-xs">{user.faculty_id}</Badge>
                        )}
                        {!((getUserRoles(user).includes('Student') && user.student_id) || (getUserRoles(user).includes('Faculty') && user.faculty_id)) && (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDate(user.created_at)}</span>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 pt-2">
                          {showingDeleted ? (
                            <Button 
                              size="sm" 
                              variant="default" 
                              onClick={() => handleRestore(user)}
                              disabled={restoringId === user.id}
                            >
                              {restoringId === user.id ? (
                                <>
                                  <span className="mr-1 h-3 w-3 animate-spin">⟳</span>
                                  Restoring...
                                </>
                              ) : (
                                <>
                                  <span className="mr-1">↻</span>
                                  Restore
                                </>
                              )}
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/users/${user.id}/edit`}>
                                  <Edit className="mr-1 h-3 w-3" /> Edit
                                </Link>
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setDeleteUser(user)}>
                                <Trash2 className="mr-1 h-3 w-3" /> Delete
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <DataTable
            columns={columns}
            items={users.data}
            sort={{ key: filters.sort_by || '', direction: filters.sort_order }}
            onSortChange={handleSort}
            responsiveMode="table"
          />
        )}

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
              const params = new URLSearchParams();
              if (filters.search) params.set('search', filters.search);
              if (filters.search_label) params.set('search_label', filters.search_label);
              if (filters.role) params.set('role', filters.role);
              if (filters.sort_by) params.set('sort_by', filters.sort_by);
              if (filters.sort_order) params.set('sort_order', filters.sort_order);
              params.set('page', String(page));
              params.set('per_page', String(perPage ?? users.per_page));
              router.get(`/users?${params.toString()}`, {}, { preserveScroll: false });
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
