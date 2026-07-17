<?php

namespace App\Contracts;

use App\Models\WhatsAppAccount;

interface MessagingProvider
{
    /** @return array{ok: bool, status: string, message: string, details: array<string, mixed>} */
    public function validateConnection(WhatsAppAccount $account): array;
}
