@component('mail::message')
# File access request escalated

Request #{{ $requestId }} for **{{ $researchTitle }}** ({{ $fileType }}) requires MCIIS Staff review.

**Requester:** {{ $requesterName }} ({{ $requesterEmail }})

**Adviser:** {{ $adviserName }}

**Lead author:** {{ $leadName }}

{{ $escalationReason }} This request is being escalated to you for a staff decision.

No access has been granted automatically.
@endcomponent