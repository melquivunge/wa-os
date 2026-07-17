<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\WebhookEvent;
use App\Models\WhatsAppAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MetaWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_meta_verification_returns_challenge_for_valid_token(): void
    {
        $this->get('/api/v1/webhooks/meta?hub_mode=subscribe&hub_verify_token=wa-os-demo-verify-token&hub_challenge=challenge-123')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('challenge-123');
    }

    public function test_meta_verification_rejects_invalid_token(): void
    {
        $this->get('/api/v1/webhooks/meta?hub_mode=subscribe&hub_verify_token=wrong&hub_challenge=challenge-123')
            ->assertForbidden();
    }

    public function test_meta_webhook_stores_raw_payload_without_authentication(): void
    {
        $organization = Organization::factory()->create();
        $account = WhatsAppAccount::create([
            'organization_id' => $organization->id,
            'name' => 'Conta Meta',
            'phone_number_id' => 'phone-789',
        ]);
        $payload = [
            'object' => 'whatsapp_business_account',
            'entry' => [[
                'id' => 'business-789',
                'changes' => [['value' => ['metadata' => ['phone_number_id' => 'phone-789']]]],
            ]],
        ];

        $this->postJson('/api/v1/webhooks/meta', $payload)
            ->assertOk()
            ->assertJsonPath('received', true);

        $this->assertDatabaseHas('webhook_events', [
            'organization_id' => $organization->id,
            'whatsapp_account_id' => $account->id,
            'provider_event_id' => 'business-789',
            'status' => 'received',
        ]);
        $this->assertSame($payload, WebhookEvent::firstOrFail()->payload);
    }
}
