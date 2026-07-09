import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
import HeadingSmall from '@/components/heading-small';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Download, BarChart3, Trash2 } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { SharedData } from '@/types';


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
}


export default function FacultyIndex({ faculties, filters }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.user.roles?.some(role => role.name === 'Administrator') ?? false;
   
    const [search, setSearch] = useState(filters.search || '');
    const [selectedFaculties, setSelectedFaculties] = useState<number[]>([]);


    const handleSearch = () => {
        router.get('/faculties', { search }, { preserveState: true });
    };


    const handleSort = (field: string) => {
        const newOrder = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
        router.get('/faculties', { ...filters, sort_by: field, sort_order: newOrder }, { preserveState: true });
    };


    const handleBulkDelete = () => {
        if (selectedFaculties.length === 0) return;
       
        if (confirm(`Are you sure you want to delete ${selectedFaculties.length} faculty member(s)?`)) {
            router.post('/faculties/bulk-destroy', { faculty_ids: selectedFaculties });
        }
    };


    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFaculties(faculties.data.map(f => f.id));
        } else {
            setSelectedFaculties([]);
        }
    };


    const handleSelectFaculty = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedFaculties([...selectedFaculties, id]);
        } else {
            setSelectedFaculties(selectedFaculties.filter(f => f !== id));
        }
    };


    return (
        <AppLayout>
            <Head title="Faculty Management" />
            <div className="space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Heading title={`Faculty ${isAdmin ? 'Management' : 'Directory'}`} description={isAdmin ? 'Manage faculty members and their information' : 'View faculty members and their information'} />
                    </div>
                    {isAdmin && (
                        <div className="flex items-center space-x-2">
                            <Button asChild>
                                <Link href="/faculties/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Faculty
                                </Link>
                            </Button>
                        </div>
                    )}
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


                {/* Faculty Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <HeadingSmall title="Faculty Members" description={`${faculties.total} faculty member(s) found`} />
                            </div>
                            {isAdmin && selectedFaculties.length > 0 && (
                                <Button variant="destructive" onClick={handleBulkDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected ({selectedFaculties.length})
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {isAdmin && (
                                        <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedFaculties.length === faculties.data.length && faculties.data.length > 0}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('faculty_id')}
                                    >
                                        Faculty ID
                                        {filters.sort_by === 'faculty_id' && (
                                            <span className="ml-1">
                                                {filters.sort_order === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('last_name')}
                                    >
                                        Name
                                        {filters.sort_by === 'last_name' && (
                                            <span className="ml-1">
                                                {filters.sort_order === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="w-32">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {faculties.data.map((faculty) => (
                                    <TableRow key={faculty.id}>
                                        {isAdmin && (
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFaculties.includes(faculty.id)}
                                                    onChange={(e) => handleSelectFaculty(faculty.id, e.target.checked)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Badge variant="secondary">{faculty.faculty_id}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {faculty.last_name}, {faculty.first_name}
                                                </div>
                                                {faculty.middle_name && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {faculty.middle_name}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {faculty.position && (
                                                <Badge variant="outline">{faculty.position}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {faculty.email ? (
                                                <a
                                                    href={`mailto:${faculty.email}`}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {faculty.email}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">No email</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {faculty.contact_number || (
                                                <span className="text-muted-foreground">No contact</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/faculties/${faculty.id}`}>
                                                        View
                                                    </Link>
                                                </Button>
                                                {isAdmin && (
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/faculties/${faculty.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>


                        {/* Pagination */}
                        {faculties.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((faculties.current_page - 1) * faculties.per_page) + 1} to{' '}
                                    {Math.min(faculties.current_page * faculties.per_page, faculties.total)} of{' '}
                                    {faculties.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    {faculties.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get('/faculties', { ...filters, page: faculties.current_page - 1 })}
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {faculties.current_page < faculties.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get('/faculties', { ...filters, page: faculties.current_page + 1 })}
                                        >
                                            Next
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}