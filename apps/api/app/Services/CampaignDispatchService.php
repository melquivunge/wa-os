<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\OutboundAttempt;
use Illuminate\Support\Facades\DB;

class CampaignDispatchService
{
    /** @return array{queued: int, existing: int} */
    public function queue(Campaign $campaign): array
    {
        $queued = 0;
        $existing = 0;

        DB::transaction(function () use ($campaign, &$queued, &$existing): void {
            $campaign->recipients()->each(function ($recipient) use ($campaign, &$queued, &$existing): void {
                $key = "campaign:{$campaign->id}:recipient:{$recipient->id}";
                $attempt = OutboundAttempt::firstOrCreate(
                    ['idempotency_key' => $key],
                    [
                        'organization_id' => $campaign->organization_id,
                        'campaign_id' => $campaign->id,
                        'campaign_recipient_id' => $recipient->id,
                        'status' => 'queued',
                    ],
                );
                $attempt->wasRecentlyCreated ? $queued++ : $existing++;
            });
        });

        return ['queued' => $queued, 'existing' => $existing];
    }
}
