import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
import HeadingSmall from '@/components/heading-small';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Search, Trash2, UserPen } from 'lucide-react';
import { useState } from 'react';

// Adjust this path to wherever you place FacultyCard.tsx (and its
// FacultyPhoto / FacultyTabs / FacultyDetails siblings) in your project
import FacultyCard from '@/components/faculty/faculty-card';

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
    const [selectedFaculties, setSelectedFaculties] = useState<number[]>([]);

    const handleSearch = () => {
        router.get(window.location.pathname, { search }, { preserveState: true });
    };

    const handleBulkDelete = () => {
        if (selectedFaculties.length === 0) return;

        if (confirm(`Are you sure you want to delete ${selectedFaculties.length} faculty member(s)?`)) {
            router.post('/faculty/bulk-destroy', { faculty_ids: selectedFaculties });
        }
    };

    const handleSelectFaculty = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedFaculties([...selectedFaculties, id]);
        } else {
            setSelectedFaculties(selectedFaculties.filter((f) => f !== id));
        }
    };

    return (
        <AppLayout>
            <Head title="Faculty Management" />
            <div className="space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Heading
                            title={`Faculty ${isAdmin ? 'Management' : 'Directory'}`}
                            description={isAdmin ? 'Manage faculty members and their information' : 'View faculty members and their information'}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        {isFacultyUser && ownFaculty && (
                            <Button asChild>
                                <Link href={`/faculty/${ownFaculty.id}/edit`}>
                                    <UserPen className="mr-2 size-4" />
                                    Edit My Profile
                                </Link>
                            </Button>
                        )}
                        {isAdmin && (
                            <Button asChild>
                                <Link href="/faculty/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Faculty
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <HeadingSmall title="Search & Filters" description="Find specific faculty members" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Input
                                placeholder="Search by name, ID, or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="max-w-sm"
                            />
                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Faculty Cards */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <HeadingSmall title="Faculty Members" description={`${faculties.total} faculty member(s) found`} />
                        {isAdmin && selectedFaculties.length > 0 && (
                            <Button variant="destructive" onClick={handleBulkDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedFaculties.length})
                            </Button>
                        )}
                    </div>

                    {faculties.data.map((faculty) => (
                        <FacultyCard
                            key={faculty.id}
                            faculty={faculty}
                            isAdmin={isAdmin}
                            selected={selectedFaculties.includes(faculty.id)}
                            onSelectChange={(checked) => handleSelectFaculty(faculty.id, checked)}
                        />
                    ))}

                    {faculties.data.length === 0 && (
                        <Card>
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
        </AppLayout>
    );
}