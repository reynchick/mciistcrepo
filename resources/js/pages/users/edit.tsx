import { useState } from 'react'
import { Head } from '@inertiajs/react'
import { Trash2 } from 'lucide-react'
import AppLayout from '@/layouts/app/app-layout'
import { Button } from '@/components/ui/button'
import UserForm from '@/components/user/user-form'
import DeleteUserModal from '@/components/user/delete-user-modal'
import ActivityTimeline from '@/components/user/activity-timeline'
import Heading from '@/components/heading'

type RoleOption = { id: number; name: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'; description?: string }

type AuditEvent = {
	id: number
	action_type: string
	created_at: string
	modified_by?: { id: number; first_name: string; last_name: string }
	old_values?: Record<string, any>
	new_values?: Record<string, any>
	metadata?: Record<string, any>
}

type UserInitial = {
	id: number
	first_name: string
	middle_name?: string | null
	last_name: string
	email: string
	contact_number?: string | null
	student_id?: string | null
	faculty_id?: string | null
	roles?: Array<{ id: number; name: RoleOption['name'] }>
	created_at?: string
	updated_at?: string
}

interface Props {
	user: UserInitial
	roles: RoleOption[]
	auditLogs?: AuditEvent[]
	adminCount?: number
}

export default function EditUser({ user, roles, auditLogs = [], adminCount = 1 }: Props) {
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	
	const fullName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')
	
	// Removed formatDate; timestamps are shown via Activity History only

	return (
		<AppLayout>
			<Head title={`Edit User: ${fullName}`} />

			<div className="space-y-6 p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
					<Heading title={`Edit User: ${fullName}`} description="Update account details and roles." />
					<Button
						variant="destructive"
						onClick={() => setShowDeleteModal(true)}
						className="w-full sm:w-auto"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete User
					</Button>
				</div>

				<UserForm
					mode="edit"
					initial={user}
					roles={roles}
					adminCount={adminCount}
					onCancelHref="/users"
					onSuccessHref="/users"
				/>

				{/* Activity Timeline */}
				{auditLogs && auditLogs.length > 0 && (
					<ActivityTimeline events={auditLogs} userId={user.id} fullHistoryHref={`/logs?subjectType=User&subjectId=${user.id}`} />
				)}
			</div>

			{/* Delete User Modal */}
			<DeleteUserModal
				open={showDeleteModal}
				onOpenChange={setShowDeleteModal}
				user={user}
				isLastAdministrator={adminCount === 1 && user.roles?.some(r => r.name === 'Administrator')}
				adminRemainingCount={adminCount}
				onDeleted={() => {
					window.location.href = '/users'
				}}
			/>
		</AppLayout>
	)
}
