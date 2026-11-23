import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import UserForm from '@/components/user/user-form'
import Heading from '@/components/heading'
import { ChevronLeft } from 'lucide-react'

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
				<div>
					<Link
						href="/users"
						className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
					>
						<ChevronLeft className="h-4 w-4" />
						Back to Users
					</Link>
					<Heading title="Add New User" description="Create a new account and assign roles." />
				</div>

				<UserForm mode="create" roles={roles} adminCount={adminCount} onCancelHref="/users" onSuccessHref="/users" />
			</div>
		</AppLayout>
	)
}
