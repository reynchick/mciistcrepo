<?php

namespace App\Services;

use App\Mail\ResearcherInvitedMail;
use App\Mail\ResearchSubmittedMail;
use App\Mail\ResearchReturnedMail;
use App\Mail\AdviserMetadataRequestedMail;
use App\Mail\ResearchPublishedMail;
use App\Models\Research;
use Illuminate\Support\Facades\Mail;

class ResearchMailService
{
    public function sendResearchInvited(Research $research, string $email, string $token): void
    {
        Mail::to($email)->queue(new ResearcherInvitedMail($research, $email, $token));
    }

    public function sendResearchSubmitted(Research $research): void
    {
        foreach ($this->recipientEmails($research, ['adviser']) as $email) {
            Mail::to($email)->queue(new ResearchSubmittedMail($research, $email));
        }
    }

    public function sendResearchReturned(Research $research): void
    {
        foreach ($this->recipientEmails($research, ['researchers']) as $email) {
            Mail::to($email)->queue(new ResearchReturnedMail($research, $email));
        }
    }

    public function sendAdviserMetadataRequested(Research $research): void
    {
        foreach ($this->recipientEmails($research, ['adviser']) as $email) {
            Mail::to($email)->queue(new AdviserMetadataRequestedMail($research, $email));
        }
    }

    public function sendResearchPublished(Research $research): void
    {
        foreach ($this->recipientEmails($research, ['researchers']) as $email) {
            Mail::to($email)->queue(new ResearchPublishedMail($research, $email));
        }
    }

    protected function recipientEmails(Research $research, array $roles): array
    {
        $emails = [];

        if (in_array('adviser', $roles, true) && $research->adviser?->email) {
            $emails[] = $research->adviser->email;
        }

        if (in_array('researchers', $roles, true)) {
            foreach ($research->researchers()->pluck('email')->filter() as $email) {
                $emails[] = $email;
            }
        }

        return array_values(array_unique($emails));
    }
}
