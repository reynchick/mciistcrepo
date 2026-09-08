import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, AlertCircle } from 'lucide-react';

export default function EditStudent({ student }) {
    const { data, setData, put, processing, errors } = useForm({
        first_name: student.first_name,
        middle_name: student.middle_name || '',
        last_name: student.last_name,
        student_id: student.student_id,
        email: student.email,
    });

    const [emailChecked, setEmailChecked] = useState(true);
    const [emailUnique, setEmailUnique] = useState(true);
    const [studentIdChecked, setStudentIdChecked] = useState(true);
    const [studentIdUnique, setStudentIdUnique] = useState(true);

    const handleEmailCheck = React.useCallback(async () => {
        if (!data.email) return;
        
        try {
            const response = await fetch(
                `${route('admin.students.check-email')}?email=${encodeURIComponent(data.email)}&ignore=${student.id}`
            );
            const result = await response.json();
            setEmailUnique(result.unique);
            setEmailChecked(true);
        } catch (error) {
            console.error('Error checking email:', error);
        }
    }, [data.email, student.id]);

    const handleStudentIdCheck = React.useCallback(async () => {
        if (!data.student_id) return;
        
        try {
            const response = await fetch(
                `${route('admin.students.check-student-id')}?student_id=${encodeURIComponent(data.student_id)}&ignore=${student.id}`
            );
            const result = await response.json();
            setStudentIdUnique(result.unique);
            setStudentIdChecked(true);
        } catch (error) {
            console.error('Error checking student ID:', error);
        }
    }, [data.student_id, student.id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.students.update', student.id));
    };

    const isFormValid =
        data.first_name.trim() &&
        data.last_name.trim() &&
        data.student_id.trim() &&
        data.email.trim() &&
        emailUnique &&
        studentIdUnique;

    const getStatusColor = () => {
        if (!student.access_approved && !student.access_status === 'revoked') {
            return 'bg-yellow-50 border-yellow-200';
        }
        if (student.access_status === 'revoked') {
            return 'bg-red-50 border-red-200';
        }
        return 'bg-green-50 border-green-200';
    };

    const getStatusBadge = () => {
        if (!student.access_approved && student.access_status !== 'revoked') {
            return <Badge variant="outline" className="bg-yellow-100">Unapproved</Badge>;
        }
        if (student.access_status === 'revoked') {
            return <Badge variant="destructive">Revoked</Badge>;
        }
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
    };

    return (
        <AppLayout>
            <Head title={`Edit Student - ${student.first_name} ${student.last_name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <a
                        href={route('admin.students.index')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Students
                    </a>
                    <div className="flex items-center gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {student.first_name} {student.last_name}
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Student ID: {student.student_id}
                            </p>
                        </div>
                        {getStatusBadge()}
                    </div>
                </div>

                {/* Status Alert */}
                {student.access_status === 'revoked' && (
                    <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-900">
                            <strong>Access Revoked:</strong> This student's account access was revoked on {student.access_revoked_at}. 
                            Click "Approve Access" below to restore their access.
                        </AlertDescription>
                    </Alert>
                )}

                {!student.access_approved && student.access_status !== 'revoked' && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-900">
                            <strong>Unapproved:</strong> This student's account has not yet been approved for system access.
                            Click "Approve Access" below to grant them access.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form */}
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    className="mt-1"
                                    placeholder="John"
                                />
                                <InputError message={errors.first_name} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Middle Name
                                </label>
                                <Input
                                    type="text"
                                    value={data.middle_name}
                                    onChange={(e) => setData('middle_name', e.target.value)}
                                    className="mt-1"
                                    placeholder="Michael"
                                />
                                <InputError message={errors.middle_name} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    className="mt-1"
                                    placeholder="Doe"
                                />
                                <InputError message={errors.last_name} />
                            </div>
                        </div>

                        {/* Student ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Student ID <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    type="text"
                                    value={data.student_id}
                                    onChange={(e) => {
                                        setData('student_id', e.target.value);
                                        setStudentIdChecked(false);
                                    }}
                                    placeholder="2023-00800"
                                    pattern="\d{4}-\d{5}"
                                    title="Format: YYYY-NNNNN (e.g., 2023-00800)"
                                />
                                {!studentIdChecked && data.student_id !== student.student_id && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleStudentIdCheck}
                                        className="whitespace-nowrap"
                                    >
                                        Check
                                    </Button>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Format: YYYY-NNNNN (e.g., 2023-00800)
                            </p>
                            {!studentIdChecked && data.student_id !== student.student_id && studentIdUnique === false && (
                                <p className="mt-1 text-sm text-red-600">
                                    This student ID is already in use
                                </p>
                            )}
                            <InputError message={errors.student_id} />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => {
                                        setData('email', e.target.value);
                                        setEmailChecked(false);
                                    }}
                                    placeholder="john.doe@usep.edu.ph"
                                />
                                {!emailChecked && data.email !== student.email && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleEmailCheck}
                                        className="whitespace-nowrap"
                                    >
                                        Check
                                    </Button>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Must be a USeP email (@usep.edu.ph)
                            </p>
                            {!emailChecked && data.email !== student.email && emailUnique === false && (
                                <p className="mt-1 text-sm text-red-600">
                                    This email is already in use
                                </p>
                            )}
                            <InputError message={errors.email} />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={!isFormValid || processing}
                                className="gap-2"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Access Management */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Access Management</h2>
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700 mb-4">
                                {student.access_status === 'approved'
                                    ? 'This student has been approved for system access. They can log in via Google SSO.'
                                    : student.access_status === 'revoked'
                                    ? 'This student\'s access has been revoked. They cannot log in to the system.'
                                    : 'This student has not been approved yet. They cannot log in to the system.'}
                            </p>
                            
                            {student.access_status === 'approved' ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (confirm('Revoke access for this student?')) {
                                            window.location.href = route('admin.students.revoke-access', student.id);
                                        }
                                    }}
                                >
                                    <Button variant="destructive" type="submit">
                                        Revoke Access
                                    </Button>
                                </form>
                            ) : (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (confirm('Approve access for this student?')) {
                                            window.location.href = route('admin.students.approve-access', student.id);
                                        }
                                    }}
                                >
                                    <Button type="submit">
                                        Approve Access
                                    </Button>
                                </form>
                            )}
                        </div>

                        {student.access_approved_at && (
                            <div className="text-sm text-gray-600 border-t pt-4">
                                <p>Access approved on: <strong>{student.access_approved_at}</strong></p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Danger Zone */}
                <Card className="p-6 border-red-200 bg-red-50">
                    <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
                    <p className="text-sm text-red-800 mb-4">
                        Deleting this student record will remove all associated data. This action cannot be undone.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this student? This cannot be undone.')) {
                                window.location.href = route('admin.students.destroy', student.id);
                            }
                        }}
                    >
                        Delete Student Record
                    </Button>
                </Card>
            </div>
        </AppLayout>
    );
}
