<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WebhookEvent;
use App\Models\WhatsAppAccount;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MetaWebhookController extends Controller
{
    public function verify(Request $request): Response
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        abort_unless($mode === 'subscribe' && hash_equals((string) config('services.meta.webhook_verify_token'), (string) $token), 403);

        return response((string) $challenge, 200, ['Content-Type' => 'text/plain']);
    }

    public function receive(Request $request): Response
    {
        $payload = $request->json()->all();
        $phoneNumberId = data_get($payload, 'entry.0.changes.0.value.metadata.phone_number_id');
        $account = is_string($phoneNumberId)
            ? WhatsAppAccount::query()->where('phone_number_id', $phoneNumberId)->first()
            : null;

        WebhookEvent::create([
            'organization_id' => $account?->organization_id,
            'whatsapp_account_id' => $account?->id,
            'provider' => 'meta',
            'provider_event_id' => data_get($payload, 'entry.0.id'),
            'payload' => $payload,
            'headers' => collect($request->headers->all())->except(['authorization', 'cookie'])->all(),
            'status' => 'received',
            'received_at' => now(),
        ]);

        return response()->json(['received' => true]);
    }
}
