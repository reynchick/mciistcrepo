<x-mail::message>
# Research Invitation

You have been invited to contribute to the research submission: **{{ $researchTitle }}**.

Please use the invitation link below to continue:

<x-mail::button :url="route('research.invitation', ['token' => $token])">
Open Invitation
</x-mail::button>

Thanks,
{{ config('app.name') }}
</x-mail::message>
