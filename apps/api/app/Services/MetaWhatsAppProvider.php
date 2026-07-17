<?php

namespace App\Services;

use App\Contracts\MessagingProvider;
use App\Models\WhatsAppAccount;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class MetaWhatsAppProvider implements MessagingProvider
{
    public function validateConnection(WhatsAppAccount $account): array
    {
        if (! $account->access_token || ! $account->phone_number_id) {
            return ['ok' => false, 'status' => 'needs_credentials', 'message' => 'Informe o token e o phone number ID para validar a conta Meta.', 'details' => []];
        }

        $response = $this->client($account)->get($account->phone_number_id, ['fields' => 'id,display_phone_number,verified_name,quality_rating']);
        if ($response->successful()) {
            return ['ok' => true, 'status' => 'connected', 'message' => 'Conta WhatsApp validada com a Meta.', 'details' => $response->json() ?: []];
        }

        return ['ok' => false, 'status' => 'validation_failed', 'message' => 'A Meta recusou a validação da conta WhatsApp.', 'details' => ['provider_status' => $response->status(), 'error' => $response->json('error.message')]];
    }

    private function client(WhatsAppAccount $account): PendingRequest
    {
        return Http::acceptJson()->withToken($account->access_token)->baseUrl(rtrim(config('services.meta.graph_url'), '/').'/')->timeout(10);
    }
}
