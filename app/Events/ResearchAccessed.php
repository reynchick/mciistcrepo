<?php

namespace App\Events;

class ResearchAccessed
{
    public int $researchId;
    public ?int $userId;
    public ?string $ipAddress;
    public ?string $userAgent;

    public function __construct(int $researchId, ?int $userId = null, ?string $ipAddress = null, ?string $userAgent = null)
    {
        $this->researchId = $researchId;
        $this->userId = $userId;
        $this->ipAddress = $ipAddress;
        $this->userAgent = $userAgent;
    }
}
