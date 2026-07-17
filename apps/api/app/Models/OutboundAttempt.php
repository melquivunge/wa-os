<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'organization_id', 'campaign_id', 'campaign_recipient_id', 'idempotency_key',
    'status', 'attempts', 'provider_request_id', 'last_error', 'started_at', 'completed_at',
])]
class OutboundAttempt extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return ['attempts' => 'integer', 'started_at' => 'datetime', 'completed_at' => 'datetime'];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(CampaignRecipient::class, 'campaign_recipient_id');
    }
}
