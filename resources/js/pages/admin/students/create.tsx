import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { InputError } from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft } from 'lucide-react';

export default function CreateStudent() {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        student_id: '',
        email: '',
    });

    const [emailChecked, setEmailChecked] = useState(false);
    const [emailUnique, setEmailUnique] = useState(true);
    const [studentIdChecked, setStudentIdChecked] = useState(false);
    const [studentIdUnique, setStudentIdUnique] = useState(true);

    const handleEmailCheck = React.useCallback(async () => {
        if (!data.email) return;
        
        try {
            const response = await fetch(
                `${route('admin.students.check-email')}?email=${encodeURIComponent(data.email)}`
            );
            const result = await response.json();
            setEmailUnique(result.unique);
            setEmailChecked(true);
        } catch (error) {
            console.error('Error checking email:', error);
        }
    }, [data.email]);

    const handleStudentIdCheck = React.useCallback(async () => {
        if (!data.student_id) return;
        
        try {
            const response = await fetch(
                `${route('admin.students.check-student-id')}?student_id=${encodeURIComponent(data.student_id)}`
            );
            const result = await response.json();
            setStudentIdUnique(result.unique);
            setStudentIdChecked(true);
        } catch (error) {
            console.error('Error checking student ID:', error);
        }
    }, [data.student_id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.students.store'));
    };

    const isFormValid =
        data.first_name.trim() &&
        data.last_name.trim() &&
        data.student_id.trim() &&
        data.email.trim() &&
        emailUnique &&
        studentIdUnique;

    return (
        <AppLayout>
            <Head title="Add Student" />

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
                    <h1 className="text-3xl font-bold tracking-tight">Add Student</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Create a new student record and approve access
                    </p>
                </div>

                {/* Form */}
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Student ID Info */}
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertDescription className="text-blue-900 text-sm">
                                <strong>Note:</strong> Students added here will be automatically approved for system access and can log in via Google SSO.
                            </AlertDescription>
                        </Alert>

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
                                {data.student_id && !studentIdChecked && (
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
                            {studentIdChecked && !studentIdUnique && (
                                <p className="mt-1 text-sm text-red-600">
                                    This student ID is already in use
                                </p>
                            )}
                            {studentIdChecked && studentIdUnique && (
                                <p className="mt-1 text-sm text-green-600">
                                    ✓ Student ID is available
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
                                {data.email && !emailChecked && (
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
                            {emailChecked && !emailUnique && (
                                <p className="mt-1 text-sm text-red-600">
                                    This email is already in use
                                </p>
                            )}
                            {emailChecked && emailUnique && (
                                <p className="mt-1 text-sm text-green-600">
                                    ✓ Email is available
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
                                {processing ? 'Adding...' : 'Add Student'}
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
            </div>
        </AppLayout>
    );
}
