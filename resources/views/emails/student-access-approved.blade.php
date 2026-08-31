@component('mail::message')
# Student Account Approved

Hello {{ $user->first_name }},

{{ $approvalMessage }}

**Account Details:**
- Student ID: {{ $user->student_id }}
- Email: {{ $user->email }}

You can now log in to the research repository using your USeP email address. You'll authenticate via Google SSO for security.

@component('mail::button', ['url' => route('login')])
Login to Your Account
@endcomponent

Once you've logged in, you'll have access to:
- Browse and search research publications
- Request access to research files
- View file access requests you've submitted
- Manage your student profile information

If you have any questions or encounter any issues logging in, please don't hesitate to reach out to our support team.

Thank you for being part of the Research Repository community!

Best regards,<br>
The Research Repository Team
@endcomponent
