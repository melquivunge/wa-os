<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'organization_id',
    'source_name',
    'team_name',
    'status',
    'total_rows',
    'accepted_rows',
    'failed_rows',
    'failure_samples',
    'processed_at',
])]
class ContactImport extends Model
{
    use HasUuids;

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    protected function casts(): array
    {
        return [
            'failure_samples' => 'array',
            'processed_at' => 'datetime',
        ];
    }
}
