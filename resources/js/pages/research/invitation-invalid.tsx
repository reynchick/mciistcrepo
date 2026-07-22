import { Head } from '@inertiajs/react'

export default function InvitationInvalid() {
  return (
    <>
      <Head title="Invitation invalid" />
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-lg border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Invitation invalid or expired</h1>
          <p className="mt-3 text-sm text-slate-600">
            This invitation link is no longer valid. Please contact the research owner to request a new invitation.
          </p>
        </div>
      </div>
    </>
  )
}
