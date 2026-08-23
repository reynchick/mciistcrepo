<x-mail::message>
# Research Invitation

You have been invited to contribute to the research submission: **{{ $researchTitle }}**.

<x-mail::button :url="$actionUrl">
Open Invitation
</x-mail::button>

Thanks,
{{ config('app.name') }}
</x-mail::message>
