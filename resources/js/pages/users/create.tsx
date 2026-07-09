import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import UserForm from '@/components/user/user-form'
import Heading from '@/components/heading'

type RoleOption = { id: number; name: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'; description?: string }

interface Props {
	roles: RoleOption[]
	adminCount?: number
}

export default function CreateUser({ roles, adminCount = 1 }: Props) {
	return (
		<AppLayout>
			<Head title="Add New User" />

			<div className="space-y-6 p-4 sm:p-6">
				<Heading title="Add New User" description="Create a new account and assign roles." />

				<UserForm mode="create" roles={roles} adminCount={adminCount} onCancelHref="/users" onSuccessHref="/users" />
			</div>
		</AppLayout>
	)
}
