<?php

namespace App\Services;

use App\Models\Campaign;
use Illuminate\Validation\ValidationException;

class CampaignTransitionService
{
    /** @var array<string, list<string>> */
    private const ALLOWED_TRANSITIONS = [
        'start' => ['draft', 'scheduled'],
        'pause' => ['scheduled', 'sending'],
        'resume' => ['paused'],
        'cancel' => ['draft', 'scheduled', 'sending', 'paused'],
    ];

    /** @return array{ready: bool, errors: array<string, list<string>>, warnings: list<string>} */
    public function validate(Campaign $campaign): array
    {
        $campaign->loadMissing(['audience', 'messageTemplate']);

        $errors = [];
        $warnings = [];

        if ($campaign->status === 'canceled' || $campaign->status === 'completed' || $campaign->status === 'failed') {
            $errors['status'][] = 'A campanha já está em um estado terminal.';
        }

        if ($campaign->audience === null) {
            $errors['audience_id'][] = 'Selecione uma audiência antes de iniciar.';
        } elseif ($campaign->audience->contact_count < 1) {
            $errors['audience_id'][] = 'A audiência não possui contatos elegíveis.';
        }

        if ($campaign->messageTemplate === null) {
            $errors['message_template_id'][] = 'Selecione um template aprovado antes de iniciar.';
        } elseif ($campaign->messageTemplate->status !== 'approved') {
            $errors['message_template_id'][] = 'O template precisa estar aprovado.';
        }

        if ($campaign->audience !== null && $campaign->messageTemplate !== null && $campaign->audience->team_name !== $campaign->messageTemplate->team_name) {
            $errors['team_name'][] = 'A audiência e o template precisam pertencer ao mesmo time.';
        }

        if ($campaign->message_count < 1) {
            $errors['message_count'][] = 'A campanha precisa ter pelo menos um destinatário.';
        }

        if ($campaign->status === 'scheduled' && $campaign->scheduled_at === null) {
            $errors['scheduled_at'][] = 'Campanhas agendadas precisam de data de envio.';
        }

        if ($campaign->status === 'scheduled' && $campaign->scheduled_at !== null && $campaign->scheduled_at->isPast()) {
            $warnings[] = 'A data agendada já passou; iniciar agora irá usar o horário atual.';
        }

        return [
            'ready' => $errors === [],
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    public function start(Campaign $campaign): Campaign
    {
        $this->ensureAllowed($campaign, 'start');
        $validation = $this->validate($campaign);

        if (! $validation['ready']) {
            throw ValidationException::withMessages($validation['errors']);
        }

        $startedAt = $campaign->started_at ?? now();
        $outcome = $this->simulateOutcome($campaign);

        $campaign->forceFill([
            'status' => 'completed',
            'started_at' => $startedAt,
            'completed_at' => $campaign->completed_at ?? $startedAt->copy()->addMinutes(12),
            'delivered_count' => $outcome['delivered'],
            'read_count' => $outcome['read'],
            'failed_count' => $outcome['failed'],
        ])->save();

        return $campaign->refresh();
    }

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

    /** @return array{delivered: int, read: int, failed: int} */
    private function simulateOutcome(Campaign $campaign): array
    {
        $messages = $campaign->message_count;
        $hash = abs(crc32($campaign->id));
        $failureRate = 2 + ($hash % 4);
        $readRate = 74 + ($hash % 12);
        $failed = (int) round($messages * ($failureRate / 100));
        $delivered = max(0, $messages - $failed);
        $read = (int) round($delivered * ($readRate / 100));

        return [
            'delivered' => min($messages, $delivered),
            'read' => min($delivered, $read),
            'failed' => min($messages, $failed),
        ];
    }
}
