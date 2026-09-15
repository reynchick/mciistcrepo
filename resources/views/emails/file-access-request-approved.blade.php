@component('mail::message')
# File access request approved

Your request to access **{{ $researchTitle }}** has been approved by the adviser.

The requested {{ str_replace('_', ' ', $fileType) }} is attached to this email.

You can also access the file from the repository while your approved access remains active.
@endcomponent
