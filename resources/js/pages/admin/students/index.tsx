import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PaginationComponent } from '@/components/shared/pagination';
import { Search, Plus, Download, Upload, Edit2, Trash2, Lock, Unlock } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function StudentManagement({ students, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const debouncedSearch = useDebounce(search, 300);

    React.useEffect(() => {
        router.get(
            route('admin.students.index'),
            { search: debouncedSearch, status: status === 'all' ? '' : status },
            { preserveScroll: true, replace: true }
        );
    }, [debouncedSearch, status]);

    const handleDownloadTemplate = () => {
        window.location.href = route('admin.students.download-template');
    };

    const getStatusBadge = (student) => {
        if (!student.access_approved && !student.access_revoked_at) {
            return <Badge variant="outline" className="bg-yellow-50">Unapproved</Badge>;
        }
        if (student.access_revoked_at) {
            return <Badge variant="destructive">Revoked</Badge>;
        }
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
    };

    const getStatusColor = (student) => {
        if (!student.access_approved && !student.access_revoked_at) {
            return 'text-yellow-700';
        }
        if (student.access_revoked_at) {
            return 'text-red-700';
        }
        return 'text-green-700';
    };

    return (
        <AppLayout>
            <Head title="Student Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage student records, approvals, and access
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadTemplate}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            CSV Template
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('csv-upload').click()}
                            className="gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Import CSV
                        </Button>
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    const formData = new FormData();
                                    formData.append('csv_file', e.target.files[0]);
                                    router.post(route('admin.students.import-csv'), formData);
                                }
                            }}
                        />
                        <Button
                            asChild
                            size="sm"
                            className="gap-2"
                        >
                            <a href={route('admin.students.create')}>
                                <Plus className="h-4 w-4" />
                                Add Student
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-gray-700">Search</label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name, email, or student ID..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="w-full sm:w-40">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="unapproved">Unapproved</SelectItem>
                                        <SelectItem value="revoked">Revoked</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Table */}
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Added</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.data.length > 0 ? (
                                students.data.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">
                                            {student.first_name} {student.middle_name && student.middle_name + ' '} {student.last_name}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{student.student_id}</TableCell>
                                        <TableCell className="text-sm">{student.email}</TableCell>
                                        <TableCell>{getStatusBadge(student)}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{student.created_at}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{student.last_login}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a href={route('admin.students.edit', student.id)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                {student.access_approved && !student.access_revoked_at && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm('Revoke access for this student?')) {
                                                                router.post(route('admin.students.revoke-access', student.id));
                                                            }
                                                        }}
                                                        title="Revoke Access"
                                                    >
                                                        <Lock className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                )}
                                                {(!student.access_approved || student.access_revoked_at) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm('Approve access for this student?')) {
                                                                router.post(route('admin.students.approve-access', student.id));
                                                            }
                                                        }}
                                                        title="Approve Access"
                                                    >
                                                        <Unlock className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (confirm('Delete this student record? This cannot be undone.')) {
                                                            router.delete(route('admin.students.destroy', student.id));
                                                        }
                                                    }}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-600">
                                        No students found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Pagination */}
                {students.last_page > 1 && (
                    <PaginationComponent pagination={students} />
                )}
            </div>
        </AppLayout>
    );
}
