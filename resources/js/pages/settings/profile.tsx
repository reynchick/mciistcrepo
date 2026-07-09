import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Profile() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your profile information" />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                {/* Name Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">First Name *</Label>
                                        <Input
                                            id="first_name"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.first_name}
                                            name="first_name"
                                            required
                                            autoComplete="given-name"
                                            placeholder="First name"
                                        />
                                        <InputError className="mt-2" message={errors.first_name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="middle_name">Middle Name</Label>
                                        <Input
                                            id="middle_name"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.middle_name ?? ''}
                                            name="middle_name"
                                            autoComplete="additional-name"
                                            placeholder="Middle name"
                                        />
                                        <InputError className="mt-2" message={errors.middle_name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">Last Name *</Label>
                                        <Input
                                            id="last_name"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.last_name}
                                            name="last_name"
                                            required
                                            autoComplete="family-name"
                                            placeholder="Last name"
                                        />
                                        <InputError className="mt-2" message={errors.last_name} />
                                    </div>
                                </div>

                                {/* Identification Fields (read-only) */}
                                {(auth.user.roles ?? []).some((r) => (r.name ?? '').trim().toLowerCase() === 'student') && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="student_id">Student ID</Label>
                                        <Input
                                            id="student_id"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.student_id ?? ''}
                                            disabled
                                            readOnly
                                            placeholder="2023-00800"
                                        />
                                    </div>
                                )}
                                {(auth.user.roles ?? []).some((r) => (r.name ?? '').trim().toLowerCase() === 'faculty') && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="faculty_id">Faculty ID</Label>
                                        <Input
                                            id="faculty_id"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.faculty_id as string}
                                            disabled
                                            readOnly
                                            placeholder="e.g., USeP-XXXXX"
                                        />
                                    </div>
                                )}

                                {/* Contact Number */}
                                <div className="grid gap-2">
                                    <Label htmlFor="contact_number">Contact Number *</Label>
                                    <Input
                                        id="contact_number"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.contact_number ?? ''}
                                        name="contact_number"
                                        required
                                        autoComplete="tel"
                                        placeholder="09XXXXXXXXX or +63 9XXXXXXXXX"
                                    />
                                    <InputError className="mt-2" message={errors.contact_number} />
                                </div>

                                {/* Email (read-only) */}
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        disabled
                                        readOnly
                                        placeholder="email@usep.edu.ph"
                                    />
                                </div>

                                {/* Roles (read-only) */}
                                <div className="grid gap-2">
                                    <Label>Roles</Label>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {(() => {
                                            const roles = (auth.user.roles ?? []).map((r) => ({
                                                id: r.id,
                                                name: (r.name ?? '').trim(),
                                            }));
                                            if (!roles.length) {
                                                return <Badge variant="outline">No role assigned</Badge>;
                                            }
                                            const variantFor = (roleName: string) => {
                                                const n = roleName.toLowerCase();
                                                if (n === 'administrator') return 'default';
                                                if (n === 'mciis staff') return 'secondary';
                                                if (n === 'faculty') return 'secondary';
                                                if (n === 'student') return 'outline';
                                                return 'secondary';
                                            };
                                            return roles.map((role) => (
                                                <Badge key={role.id} variant={variantFor(role.name) as any}>
                                                    {role.name}
                                                </Badge>
                                            ));
                                        })()}
                                    </div>
                                </div>


                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
