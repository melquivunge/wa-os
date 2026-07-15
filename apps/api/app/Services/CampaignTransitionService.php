<?php

namespace App\Services;

use App\Models\Campaign;
use Illuminate\Validation\ValidationException;

class CampaignTransitionService
{
    /** @var array<string, list<string>> */
    private const ALLOWED_TRANSITIONS = [
        'pause' => ['scheduled', 'sending'],
        'resume' => ['paused'],
        'cancel' => ['draft', 'scheduled', 'sending', 'paused'],
    ];

    public function pause(Campaign $campaign): Campaign
    {
        $this->ensureAllowed($campaign, 'pause');

        $campaign->forceFill(['status' => 'paused'])->save();

        return $campaign->refresh();
    }

    public function resume(Campaign $campaign): Campaign
    {
        $this->ensureAllowed($campaign, 'resume');

        $campaign->forceFill([
            'status' => $campaign->started_at === null ? 'scheduled' : 'sending',
        ])->save();

        return $campaign->refresh();
    }

    public function cancel(Campaign $campaign): Campaign
    {
        $this->ensureAllowed($campaign, 'cancel');

        $campaign->forceFill([
            'status' => 'canceled',
            'completed_at' => now(),
        ])->save();

        return $campaign->refresh();
    }

    private function ensureAllowed(Campaign $campaign, string $action): void
    {
        if (in_array($campaign->status, self::ALLOWED_TRANSITIONS[$action], true)) {
            return;
        }

        throw ValidationException::withMessages([
            'status' => [sprintf(
                'A campanha não pode executar "%s" quando está com status "%s".',
                $action,
                $campaign->status,
            )],
        ]);
    }
}
