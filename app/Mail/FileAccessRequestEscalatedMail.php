<?php

namespace App\Mail;

use App\Models\GuestFileRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FileAccessRequestEscalatedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public GuestFileRequest $request, public User $staff)
    {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        return new Envelope(to: $this->staff->email, subject: 'File access request escalated');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.file-access-request-escalated',
            with: [
                'researchTitle' => $this->request->research->research_title,
                'fileType' => $this->request->file_type,
                'requestId' => $this->request->id,
                'requesterName' => $this->request->guestUser?->full_name ?? 'Unknown requester',
                'requesterEmail' => $this->request->guestUser?->email ?? 'No email recorded',
                'adviserName' => $this->request->research->adviser?->full_name ?? 'Not assigned',
                'leadName' => $this->request->research->researchers->firstWhere('is_lead_author', true)?->full_name ?? 'Not available',
                'escalationReason' => 'The adviser and lead author did not respond within 7 days.',
            ],
        );
    }
}