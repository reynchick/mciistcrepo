import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
import HeadingSmall from '@/components/heading-small';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, List as ListIcon, Plus, Search, UserPen } from 'lucide-react';
import { useState } from 'react';

// Adjust this path to wherever you place FacultyCard.tsx (and its
// FacultyPhoto / FacultyTabs / FacultyDetails siblings) in your project
import FacultyCard from '@/components/faculty/faculty-card';
import FacultyEditModal from '@/components/faculty/faculty-edit-modal';
import FacultyCreateModal from '@/components/faculty/faculty-create-modal';

interface Faculty {
    id: number;
    faculty_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    position?: string;
    designation?: string;
    email?: string;
    orcid?: string;
    contact_number?: string;
    educational_attainment?: string;
    field_of_specialization?: string;
    research_interest?: string;
    profile_picture?: string | null;
}

interface Props {
    faculties: {
        data: Faculty[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        sort_by?: string;
        sort_order?: string;
    };
    ownFaculty?: { id: number; faculty_id: string } | null;
}

export default function FacultyIndex({ faculties, filters, ownFaculty = null }: Props) {
    // usePermissions resolves the session's active role (multi-role login),
    // not the full assigned-roles list — an admin acting as Faculty/Staff/Student
    // must get the read-only directory.
    const { isAdmin: isAdminRole, isFaculty: isFacultyRole } = usePermissions();
    const isAdmin = isAdminRole();
    const isFacultyUser = isFacultyRole();

    const [search, setSearch] = useState(filters.search || '');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const handleSearch = () => {
        router.get(window.location.pathname, { search }, { preserveState: true });
    };

    return (
        <AppLayout>
            <Head title="Faculty Management" />
            <div className="min-h-full space-y-4">
                <div>
                    <Heading
                        title={`Faculty ${isAdmin ? 'Management' : 'Directory'}`}
                        description={isAdmin ? 'Manage faculty members and their information' : 'View faculty members and their information'}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <HeadingSmall title="Faculty Members" description={`${faculties.total} faculty member(s) found`} />
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                            <div className="relative w-full sm:w-64 lg:w-80">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    aria-label="Search faculty"
                                    placeholder="Search by name, ID, or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="h-10 rounded-xl border-slate-200 bg-white pl-10 focus-visible:ring-slate-300"
                                />
                            </div>
                            {isFacultyUser && ownFaculty && (
                                <Button asChild>
                                    <Link href={`/faculty/${ownFaculty.id}/edit`}>
                                        <UserPen className="mr-2 size-4" />
                                        Edit My Profile
                                    </Link>
                                </Button>
                            )}
                            {isAdmin && (
                                <Button type="button" onClick={() => setIsCreateOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Faculty
                                </Button>
                            )}
                            <div
                                role="group"
                                aria-label="Faculty view mode"
                                className="flex w-fit self-start items-center gap-1 rounded-lg bg-slate-100 p-1 sm:self-auto"
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="List view"
                                    aria-pressed={viewMode === 'list'}
                                    title="List view"
                                    onClick={() => setViewMode('list')}
                                    className={`size-8 ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs hover:bg-white' : 'text-slate-500'}`}
                                >
                                    <ListIcon className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Box view"
                                    aria-pressed={viewMode === 'grid'}
                                    title="Box view"
                                    onClick={() => setViewMode('grid')}
                                    className={`size-8 ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs hover:bg-white' : 'text-slate-500'}`}
                                >
                                    <LayoutGrid className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {faculties.data.length > 0 && (
                        <div
                            className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
                                    : 'space-y-4'
                            }
                        >
                            {faculties.data.map((faculty) => (
                                <FacultyCard
                                    key={faculty.id}
                                    faculty={faculty}
                                    isAdmin={isAdmin}
                                    onEdit={setEditingFaculty}
                                    layout={viewMode}
                                />
                            ))}
                        </div>
                    )}

                    {faculties.data.length === 0 && (
                        <Card className="border-slate-200 shadow-xs">
                            <CardContent className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                No faculty members found.
                            </CardContent>
                        </Card>
                    )}

                    {/* Pagination */}
                    {faculties.last_page > 1 && (
                        <div className="flex items-center justify-between pt-2">
                            <div className="text-sm text-muted-foreground">
                                Showing {(faculties.current_page - 1) * faculties.per_page + 1} to{' '}
                                {Math.min(faculties.current_page * faculties.per_page, faculties.total)} of{' '}
                                {faculties.total} results
                            </div>
                            <div className="flex items-center space-x-2">
                                {faculties.current_page > 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(window.location.pathname, { ...filters, page: faculties.current_page - 1 })
                                        }
                                    >
                                        Previous
                                    </Button>
                                )}
                                {faculties.current_page < faculties.last_page && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(window.location.pathname, { ...filters, page: faculties.current_page + 1 })
                                        }
                                    >
                                        Next
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <FacultyEditModal
                faculty={editingFaculty}
                open={editingFaculty !== null}
                onOpenChange={(open) => !open && setEditingFaculty(null)}
            />
            <FacultyCreateModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </AppLayout>
    );
}