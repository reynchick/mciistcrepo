@component('mail::message')
# Profile Completion Required

Hello {{ $user->first_name }},

Your account has been updated to the following role(s):

**{{ $rolesFormatted }}**

Because this role requires a profile, you need to complete your profile before you can fully access the system.

@component('mail::button', ['url' => route('login')])
Go to Login
@endcomponent

Please sign in and follow the profile completion prompt.

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Thank you for being part of the Research Repository community!

Best regards,<br>
{{ config('app.name') }} Team
@endcomponent
