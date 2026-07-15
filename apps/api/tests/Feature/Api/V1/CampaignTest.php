<?php

namespace Tests\Feature\Api\V1;

use App\Enums\OrganizationRole;
use App\Models\Campaign;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:3000');
    }

    public function test_campaigns_are_scoped_to_active_organization(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        $foreign = Organization::factory()->create();
        Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'Owned campaign',
            'audience_name' => 'Customers',
            'message_count' => 100,
            'delivered_count' => 80,
        ]);
        Campaign::create([
            'organization_id' => $foreign->id,
            'name' => 'Foreign campaign',
            'audience_name' => 'Customers',
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/campaigns')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Owned campaign')
            ->assertJsonMissing(['name' => 'Foreign campaign']);
    }

    public function test_marketing_can_create_campaign_and_analyst_cannot(): void
    {
        [$organization, $marketing] = $this->membership(OrganizationRole::Marketing);
        [, $analyst] = $this->membership(OrganizationRole::Analyst, $organization);

        $this->actingAs($analyst)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/campaigns', [
                'name' => 'Read only attempt',
                'audience_name' => 'Customers',
            ])->assertForbidden();

        $this->actingAs($marketing)->withHeader('X-Organization-ID', $organization->id)
            ->postJson('/api/v1/campaigns', [
                'name' => 'Weekend promo',
                'audience_name' => 'VIP customers',
                'team_name' => 'CRM',
                'status' => 'scheduled',
                'message_count' => 450,
                'spend_amount' => 13500,
            ])->assertCreated()
            ->assertJsonPath('data.name', 'Weekend promo')
            ->assertJsonPath('data.status', 'scheduled')
            ->assertJsonPath('data.team_name', 'CRM')
            ->assertJsonPath('data.spend_amount', 13500);
    }

    public function test_summary_returns_totals_and_active_campaign(): void
    {
        [$organization, $user] = $this->membership(OrganizationRole::Analyst);
        Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'Running',
            'audience_name' => 'Active customers',
            'status' => 'sending',
            'message_count' => 1000,
            'delivered_count' => 640,
            'read_count' => 320,
            'failed_count' => 12,
            'team_name' => 'CRM',
            'spend_amount' => 30000,
        ]);
        Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'Done',
            'audience_name' => 'New customers',
            'status' => 'completed',
            'message_count' => 500,
            'delivered_count' => 490,
            'read_count' => 410,
            'failed_count' => 10,
            'team_name' => 'Growth',
            'spend_amount' => 18000,
        ]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $organization->id)
            ->getJson('/api/v1/campaigns/summary')
            ->assertOk()
            ->assertJsonPath('data.totals.sent', 1500)
            ->assertJsonPath('data.totals.delivered', 1130)
            ->assertJsonPath('data.totals.spend', 48000)
            ->assertJsonPath('data.active_campaign.name', 'Running')
            ->assertJsonPath('data.active_campaign.progress', 64)
            ->assertJsonPath('data.teams.0.name', 'CRM');
    }

    /** @return array{Organization, User} */
    private function membership(OrganizationRole $role, ?Organization $organization = null): array
    {
        $organization ??= Organization::factory()->create();
        $user = User::factory()->create();
        $organization->memberships()->create(['user_id' => $user->id, 'role' => $role]);

        return [$organization, $user];
    }
}
