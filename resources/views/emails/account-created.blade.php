@component('mail::message')
# Welcome to Research Repository

Hello {{ $user->first_name }},

{{ $accountIntro }}

**You have been assigned the following role(s):**

{{ implode(' | ', $rolesWithEmojis) }}

To get started, please log in to your account using your USeP email address. You'll authenticate via Google SSO for security.

@component('mail::button', ['url' => route('login')])
Login to Your Account
@endcomponent

@if($profileReminder)

---

**Important:** {{ $profileReminder }}

@endif

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Thank you for being part of the Research Repository community!

Best regards,<br>
{{ config('app.name') }} Team
@endcomponent
