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

    public function listTemplates(WhatsAppAccount $account): array
    {
        if (! $account->access_token || ! $account->business_account_id) {
            return ['ok' => false, 'status' => 'needs_credentials', 'message' => 'Informe o token e o business account ID para sincronizar templates.', 'templates' => []];
        }

        $response = $this->client($account)->get($account->business_account_id.'/message_templates', ['limit' => 100]);
        if (! $response->successful()) {
            return ['ok' => false, 'status' => 'sync_failed', 'message' => 'A Meta recusou a sincronização de templates.', 'templates' => []];
        }

        $templates = collect($response->json('data', []))->map(function (array $template): array {
            $bodyComponent = collect($template['components'] ?? [])->firstWhere('type', 'BODY');
            $body = is_array($bodyComponent) ? ($bodyComponent['text'] ?? '') : '';

            return [
                'provider_template_id' => $template['id'] ?? null,
                'name' => $template['name'] ?? 'Template sem nome',
                'category' => strtolower($template['category'] ?? 'marketing'),
                'status' => strtolower($template['status'] ?? 'draft'),
                'language' => $template['language'] ?? 'pt_BR',
                'body' => $body,
            ];
        })->filter(fn (array $template): bool => is_string($template['provider_template_id']) && $template['provider_template_id'] !== '')->values()->all();

        return ['ok' => true, 'status' => 'synced', 'message' => 'Templates sincronizados com a Meta.', 'templates' => $templates];
    }

    private function client(WhatsAppAccount $account): PendingRequest
    {
        return Http::acceptJson()->withToken($account->access_token)->baseUrl(rtrim(config('services.meta.graph_url'), '/').'/')->timeout(10);
    }
}
