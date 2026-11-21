import { type DataTableColumn } from '@/components/shared/data-table';
import Pagination from '@/components/shared/pagination';
import SearchBar from '@/components/shared/search-bar';
import { SortSelect } from '@/components/shared/sort-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DeleteUserModal from '@/components/user/delete-user-modal';
import UserCreateModal from '@/components/user/user-create-modal';
import UserRoleBadge from '@/components/user/user-role-badge';
import UserStatCards, { type AvatarPerson, type StatCardConfig } from '@/components/user/user-stat-cards';
import AppLayout from '@/layouts/app/app-layout';
import { cn } from '@/lib/utils';
import { type SharedData, type User, type UserRole } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Briefcase, GraduationCap, Pencil, Plus, ShieldCheck, Trash2, Users, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RoleItem {
    role: UserRole;
    count: number;
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        search_label?: string;
        role?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
        status?: 'active' | 'deleted';
    };
    roleDistribution: RoleItem[];
    deletedRoleDistribution: RoleItem[];
    recentRegistrations: number;
    totalUsersCount: number;
    deletedUsersCount: number;
    roles: Array<{ id: number; name: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'; description?: string }>;
    adminCount?: number;
    // Optional: avatar previews sent by the server for every card
    // ("active", "deleted", "Administrator", ...). When present they are always
    // available on first load, so the Deleted card never shows blank circles.
    avatarPreviews?: Record<string, { initials: string }[]>;
}

export default function UsersIndex({
    users,
    filters,
    roleDistribution,
    deletedRoleDistribution,
    totalUsersCount,
    deletedUsersCount,
    roles,
    adminCount = 1,
    avatarPreviews,
}: Props) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const isAdmin = auth.user.roles?.some((role) => role.name === 'Administrator') ?? false;

    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Client-side fallback cache of avatar previews, keyed by card id. Only used
    // when the server doesn't send `avatarPreviews`. Each key is only ever
    // overwritten when there is new, non-empty data for it.
    const [cardPeopleData, setCardPeopleData] = useState<Record<string, AvatarPerson[]>>({});

    const showingDeleted = filters.status === 'deleted';

    /* ----------------------------- data helpers ----------------------------- */

    const getFullName = (user: User) => [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ');

    const getInitials = (user: User) => `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '?';

    const getUserRoles = (user: User): UserRole[] => {
        if (user.roles && user.roles.length > 0) return user.roles.map((r) => r.name as UserRole);
        if (user.role) return [user.role as UserRole];
        return [];
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Role cards always show the active-user counts, even while viewing deleted users
    const roleCount = (role: string) => roleDistribution.find((r) => r.role === role)?.count ?? 0;

    // Alternate between the primary blue and light gray for user avatars.
    const CIRCLE_PALETTE = ['bg-[#00296B] text-white', 'bg-slate-200 text-slate-800'];
    const getCircleTone = (user: User) => {
        const index = users.data.findIndex((u) => u.id === user.id);
        return CIRCLE_PALETTE[(index < 0 ? 0 : index) % CIRCLE_PALETTE.length];
    };

    // Recompute avatar previews only when the underlying data actually changes.
    useEffect(() => {
        const buildPeople = (predicate: (user: User) => boolean): AvatarPerson[] =>
            users.data
                .filter(predicate)
                .slice(0, 3)
                .map((user) => ({ initials: getInitials(user), tone: getCircleTone(user) }));

        // users.data is only a *filtered* list when a role or search is applied,
        // so it can't represent "all active" or "all deleted" users in that case.
        const isUnfiltered = !filters.role && !filters.search;

        setCardPeopleData((prev) => {
            const next = { ...prev };

            if (isUnfiltered) {
                const people = buildPeople(() => true);
                if (people.length > 0) next[showingDeleted ? 'deleted' : 'active'] = people;
            }

            // Role cards represent the ACTIVE-user distribution, so only update
            // them while the table is showing active users.
            if (!showingDeleted) {
                const roleIds: UserRole[] = ['Administrator', 'Faculty', 'MCIIS Staff', 'Student'];
                roleIds.forEach((role) => {
                    const people = buildPeople((u) => getUserRoles(u).includes(role));
                    if (people.length > 0) next[role] = people;
                });
            }

            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users.data, showingDeleted, filters.role, filters.search]);

    // Deleted users are only sent to this page while the "deleted" view is open,
    // so on a fresh load the Deleted card has no initials to show. Quietly fetch
    // the first few deleted users in the background (same request the Deleted card
    // makes, but the result is only used for the avatars, so the table and the
    // current filters are untouched). Skipped when the server already sends
    // `avatarPreviews.deleted`. Re-runs when the deleted count changes, so the
    // circles update after a user is deleted or restored.
    const serverHasDeletedPreview = !!avatarPreviews?.deleted?.length;
    useEffect(() => {
        if (!isAdmin || serverHasDeletedPreview) return;

        if (deletedUsersCount === 0) {
            setCardPeopleData((prev) => {
                if (!prev.deleted) return prev;
                const next = { ...prev };
                delete next.deleted;
                return next;
            });
            return;
        }

        const controller = new AbortController();
        fetch('/users?status=deleted&per_page=3', {
            headers: {
                'X-Inertia': 'true',
                'X-Inertia-Version': page.version ?? '',
                'X-Requested-With': 'XMLHttpRequest',
                Accept: 'text/html, application/xhtml+xml',
            },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
                const list = json?.props?.users?.data;
                if (!Array.isArray(list)) return;
                const people: AvatarPerson[] = list.slice(0, 3).map((u: User) => ({
                    initials: `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || '?',
                    tone: '',
                }));
                if (people.length > 0) setCardPeopleData((prev) => ({ ...prev, deleted: people }));
            })
            .catch(() => {
                /* ignore: the card keeps showing the placeholder icons */
            });

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, deletedUsersCount, serverHasDeletedPreview]);

    // Prefer the server-provided previews; fall back to the client-side cache.
    const getCardPeople = (cardId: string): AvatarPerson[] => {
        const fromServer = avatarPreviews?.[cardId];
        if (fromServer && fromServer.length > 0) {
            return fromServer.map((p) => ({ initials: p.initials, tone: '' }));
        }
        return cardPeopleData[cardId] ?? [];
    };

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
            { preserveState: true, preserveScroll: true },
        );
    };

    // Role cards (Administrator, Faculty, MCIIS Staff, Student) always work on
    // ACTIVE users, so clicking one always leaves the "deleted" view.
    const handleRoleFilter = (role: string | undefined) => {
        router.get(
            '/users',
            {
                ...filters,
                status: undefined,
                role,
                search: undefined,
                search_label: undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

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
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (sort: { key?: string; direction?: 'asc' | 'desc' }) => {
        router.get('/users', { ...filters, sort_by: sort.key, sort_order: sort.direction }, { preserveState: true, preserveScroll: true });
    };

    const handleHeaderSort = (key: string) => {
        const direction = filters.sort_by === key && filters.sort_order === 'asc' ? 'desc' : 'asc';
        handleSort({ key, direction });
    };

    const handleRestore = (user: User) => {
        if (restoringId) return;
        setRestoringId(user.id);
        router.post(
            `/users/${user.id}/restore`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setRestoringId(null),
                onError: () => setRestoringId(null),
            },
        );
    };

    /* ------------------------------ stat cards ------------------------------ */

    const activeRole = filters.role;

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
    ];

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
          ];

    // Responsive columns: desktop, tablet, mobile
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);

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
                    const userRoles = getUserRoles(user);
                    return (
                        <div className="flex flex-wrap gap-1">
                            {userRoles.map((roleName) => (
                                <UserRoleBadge key={roleName} role={roleName} size="xs" />
                            ))}
                        </div>
                    );
                },
            },
        ];
        if (isAdmin) {
            columns.push({
                key: 'actions',
                header: 'Actions',
                render: (user) => (
                    <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" asChild title="Edit user" aria-label={`Edit ${getFullName(user)}`}>
                            <Link href={`/users/${user.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Delete user"
                            aria-label={`Delete ${getFullName(user)}`}
                            onClick={() => setDeleteUser(user)}
                        >
                            <Trash2 className="h-4 w-4" />
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
                    const userRoles = getUserRoles(user);
                    return (
                        <div className="flex flex-wrap gap-1">
                            {userRoles.map((roleName) => (
                                <UserRoleBadge key={roleName} role={roleName} size="xs" />
                            ))}
                        </div>
                    );
                },
            },
            {
                header: 'Student/Faculty ID',
                render: (user) => {
                    const userRoles = getUserRoles(user);
                    if (userRoles.includes('Student') && user.student_id) {
                        return (
                            <Badge variant="secondary" className="text-xs">
                                {user.student_id}
                            </Badge>
                        );
                    }
                    if (userRoles.includes('Faculty') && user.faculty_id) {
                        return (
                            <Badge variant="secondary" className="text-xs">
                                {user.faculty_id}
                            </Badge>
                        );
                    }
                    return <span className="text-sm text-muted-foreground">N/A</span>;
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
                            <Button size="sm" variant="default" onClick={() => handleRestore(user)} disabled={restoringId === user.id}>
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
                                <Button size="icon" variant="ghost" asChild title="Edit user" aria-label={`Edit ${getFullName(user)}`}>
                                    <Link href={`/users/${user.id}/edit`}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    title="Delete user"
                                    aria-label={`Delete ${getFullName(user)}`}
                                    onClick={() => setDeleteUser(user)}
                                >
                                    <Trash2 className="h-4 w-4" />
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

            <div className="space-y-4 font-sans">
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

                {/* Stat cards (also work as filters) */}
                <UserStatCards cards={statCards} isAdmin={isAdmin} />

                {/* Users table card */}
                <Card className="overflow-hidden rounded-lg bg-white shadow-xs">
                    <CardHeader className="gap-3 border-b bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="flex items-baseline gap-2">
                            <CardTitle className="text-base">{showingDeleted ? 'Deleted users' : 'All users'}</CardTitle>
                            <CardDescription className="text-xs">
                                {users.total === 0 ? 'No users found' : `${users.from}–${users.to} of ${users.total} shown`}
                            </CardDescription>
                        </div>

                        {/* Search and Filter */}
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <SearchBar
                                initialValue={filters.search_label || filters.search || ''}
                                placeholder="Search by name, email, or ID..."
                                onSubmit={(q, suggestion) => handleSearch(q, suggestion)}
                                suggestionsEndpoint="/users/suggestions"
                                logEndpoint={null}
                                className="flex-1"
                            />

                            <div className="flex w-full gap-3 sm:w-auto sm:items-center">
                                {/* Sort dropdown */}
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
                                        const [key, direction] = v.split(':') as [string, 'asc' | 'desc'];
                                        handleSort({ key, direction });
                                    }}
                                    className="h-10"
                                    triggerClassName="h-8 w-44 text-sm border-0 focus:ring-0"
                                />

                                {/* Mobile-Only Role Filter Dropdown (removed, replaced by segmented bar) */}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {/* User List: Accordion/List for mobile, DataTable for tablet/desktop */}
                        {windowWidth <= 640 ? (
                            <div className="divide-y divide-muted-foreground/10 overflow-hidden rounded-xl border border-muted bg-background">
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
                                                className="flex w-full items-center justify-between bg-transparent px-4 py-3 text-left font-medium focus:outline-none"
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
                                                <div className="space-y-2 px-4 pt-1 pb-3 text-sm">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-muted-foreground">Email:</span>
                                                        <span>{user.email}</span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-muted-foreground">Contact:</span>
                                                        <span>{user.contact_number || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-muted-foreground">Role(s):</span>
                                                        <span className="flex gap-1">
                                                            {getUserRoles(user).map((roleName) => (
                                                                <UserRoleBadge key={roleName} role={roleName} size="xs" />
                                                            ))}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-muted-foreground">Student/Faculty ID:</span>
                                                        {getUserRoles(user).includes('Student') && user.student_id && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {user.student_id}
                                                            </Badge>
                                                        )}
                                                        {getUserRoles(user).includes('Faculty') && user.faculty_id && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {user.faculty_id}
                                                            </Badge>
                                                        )}
                                                        {!(
                                                            (getUserRoles(user).includes('Student') && user.student_id) ||
                                                            (getUserRoles(user).includes('Faculty') && user.faculty_id)
                                                        ) && <span className="text-muted-foreground">N/A</span>}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
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
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        asChild
                                                                        title="Edit user"
                                                                        aria-label={`Edit ${getFullName(user)}`}
                                                                    >
                                                                        <Link href={`/users/${user.id}/edit`}>
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Link>
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                        title="Delete user"
                                                                        aria-label={`Delete ${getFullName(user)}`}
                                                                        onClick={() => setDeleteUser(user)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
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
                            <div className="table-scroll overflow-x-auto">
                                <Table className="w-max min-w-full bg-white font-sans whitespace-nowrap [&_td]:px-4 [&_th]:px-4">
                                    <TableHeader>
                                        <TableRow className="bg-white text-[11px] tracking-wide uppercase hover:bg-white">
                                            <TableHead className="text-muted-foreground">ID</TableHead>
                                            <TableHead className="text-muted-foreground">User</TableHead>
                                            <TableHead className="text-muted-foreground">Email</TableHead>
                                            <TableHead className="text-muted-foreground">Contact</TableHead>
                                            <TableHead className="text-muted-foreground">Role(s)</TableHead>
                                            <TableHead className="text-muted-foreground">Student/Faculty ID</TableHead>
                                            <TableHead className="text-muted-foreground">{showingDeleted ? 'Deleted' : 'Joined'}</TableHead>
                                            <TableHead className="text-muted-foreground">Status</TableHead>
                                            {isAdmin && <TableHead className="pr-4 text-right text-muted-foreground">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-sm text-muted-foreground">
                                                    No users match your filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.data.map((user) => {
                                                const userRoles = getUserRoles(user);
                                                const externalId =
                                                    (userRoles.includes('Student') && user.student_id) ||
                                                    (userRoles.includes('Faculty') && user.faculty_id) ||
                                                    null;
                                                return (
                                                    <TableRow key={user.id} className="hover:bg-muted/40">
                                                        <TableCell className="py-3 pl-4 text-sm text-muted-foreground">{user.id}</TableCell>
                                                        <TableCell className="py-3">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div
                                                                    className={cn(
                                                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                                                                        getCircleTone(user),
                                                                    )}
                                                                >
                                                                    {getInitials(user)}
                                                                </div>
                                                                <p className="truncate text-sm font-medium">{getFullName(user)}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-[240px] truncate text-sm">{user.email}</TableCell>
                                                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                                                            {user.contact_number || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                {userRoles.map((roleName) => (
                                                                    <UserRoleBadge key={roleName} role={roleName} size="xs" />
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {externalId ? (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {externalId}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">N/A</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                                                            {formatDate(showingDeleted ? user.deleted_at : user.created_at)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {showingDeleted ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-0 bg-red-100 text-[11px] font-medium text-red-700 dark:bg-red-950 dark:text-red-400"
                                                                >
                                                                    Deleted
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-0 bg-emerald-100 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                                                >
                                                                    Active
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        {isAdmin && (
                                                            <TableCell className="py-3 pr-4 text-right">
                                                                <div className="flex justify-end gap-1">
                                                                    {showingDeleted ? (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleRestore(user)}
                                                                            disabled={restoringId === user.id}
                                                                        >
                                                                            {restoringId === user.id ? 'Restoring...' : 'Restore'}
                                                                        </Button>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                asChild
                                                                                title="Edit user"
                                                                                aria-label={`Edit ${getFullName(user)}`}
                                                                            >
                                                                                <Link href={`/users/${user.id}/edit`}>
                                                                                    <Pencil className="h-4 w-4" />
                                                                                </Link>
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                                title="Delete user"
                                                                                aria-label={`Delete ${getFullName(user)}`}
                                                                                onClick={() => setDeleteUser(user)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
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
                            const params = new URLSearchParams();
                            if (filters.search) params.set('search', filters.search);
                            if (filters.search_label) params.set('search_label', filters.search_label);
                            if (filters.role) params.set('role', filters.role);
                            if (filters.status) params.set('status', filters.status);
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
                        setDeleteUser(null);
                        router.reload();
                    }}
                />
            )}
        </AppLayout>
    );
}
