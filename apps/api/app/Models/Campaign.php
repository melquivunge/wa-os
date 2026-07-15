<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'organization_id',
    'audience_id',
    'message_template_id',
    'name',
    'audience_name',
    'team_name',
    'channel',
    'status',
    'message_count',
    'delivered_count',
    'read_count',
    'failed_count',
    'spend_amount',
    'scheduled_at',
    'started_at',
    'completed_at',
])]
class Campaign extends Model
{
    use HasUuids;

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function audience(): BelongsTo
    {
        return $this->belongsTo(Audience::class);
    }

    public function messageTemplate(): BelongsTo
    {
        return $this->belongsTo(MessageTemplate::class);
    }

    protected function casts(): array
    {
        return [
            'message_count' => 'integer',
            'delivered_count' => 'integer',
            'read_count' => 'integer',
            'failed_count' => 'integer',
            'spend_amount' => 'integer',
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
