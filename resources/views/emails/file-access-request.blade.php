@component('mail::message')
# File access request

A {{ $recipientRole }} review is requested for **{{ $researchTitle }}** ({{ $fileType }}).

@component('mail::button', ['url' => $actionUrl])
Review request
@endcomponent

The review page requires authentication with the account associated with this role.
@endcomponent