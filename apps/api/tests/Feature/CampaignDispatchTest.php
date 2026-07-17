<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CampaignDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispatch_is_idempotent_per_campaign_recipient(): void
    {
        $organization = Organization::factory()->create();
        $user = User::factory()->create();
        OrganizationUser::create(['organization_id' => $organization->id, 'user_id' => $user->id, 'role' => OrganizationRole::Marketing->value]);
        $campaign = Campaign::create(['organization_id' => $organization->id, 'name' => 'Teste', 'audience_name' => 'CRM', 'team_name' => 'CRM', 'message_count' => 1, 'status' => 'sending']);
        $recipient = CampaignRecipient::create(['organization_id' => $organization->id, 'campaign_id' => $campaign->id, 'recipient_name' => 'Cliente', 'phone' => '+5511999990000', 'status' => 'queued']);
        Sanctum::actingAs($user);

        $request = fn () => $this->withHeader('X-Organization-ID', $organization->id)->postJson("/api/v1/campaigns/{$campaign->id}/dispatch");
        $request()->assertOk()->assertJsonPath('data.queued', 1);
        $request()->assertOk()->assertJsonPath('data.queued', 0)->assertJsonPath('data.existing', 1);
        $this->assertDatabaseCount('outbound_attempts', 1);
        $this->assertDatabaseHas('outbound_attempts', ['campaign_recipient_id' => $recipient->id, 'idempotency_key' => "campaign:{$campaign->id}:recipient:{$recipient->id}"]);
    }
}
