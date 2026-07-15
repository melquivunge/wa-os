<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\Campaign;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CampaignLifecycleActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_marketing_user_can_pause_and_resume_a_scheduled_campaign(): void
    {
        [$organization, $user] = $this->createMember(OrganizationRole::Marketing);
        $campaign = $this->createCampaign($organization, ['status' => 'scheduled']);

        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/pause")
            ->assertOk()
            ->assertJsonPath('data.status', 'paused');

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/resume")
            ->assertOk()
            ->assertJsonPath('data.status', 'scheduled');
    }

    public function test_cancel_marks_campaign_as_canceled_and_sets_completion_time(): void
    {
        [$organization, $user] = $this->createMember(OrganizationRole::Admin);
        $campaign = $this->createCampaign($organization, ['status' => 'sending', 'started_at' => now()->subMinutes(5)]);

        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'canceled')
            ->assertJsonPath('data.timeline.3.state', 'done');

        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'status' => 'canceled',
        ]);
        $this->assertNotNull($campaign->refresh()->completed_at);
    }

    public function test_analyst_cannot_operate_campaigns(): void
    {
        [$organization, $user] = $this->createMember(OrganizationRole::Analyst);
        $campaign = $this->createCampaign($organization, ['status' => 'scheduled']);

        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/pause")
            ->assertForbidden();
    }

    public function test_invalid_transition_returns_validation_error(): void
    {
        [$organization, $user] = $this->createMember(OrganizationRole::Marketing);
        $campaign = $this->createCampaign($organization, ['status' => 'completed']);

        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/pause")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_campaign_from_another_tenant_is_hidden(): void
    {
        [$organization, $user] = $this->createMember(OrganizationRole::Marketing);
        $otherOrganization = Organization::factory()->create();
        $campaign = $this->createCampaign($otherOrganization, ['status' => 'scheduled']);

        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/pause")
            ->assertNotFound();
    }

    /** @return array{Organization, User} */
    private function createMember(OrganizationRole $role): array
    {
        $organization = Organization::factory()->create();
        $user = User::factory()->create();

        OrganizationUser::create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role' => $role->value,
        ]);

        return [$organization, $user];
    }

    /** @param array<string, mixed> $attributes */
    private function createCampaign(Organization $organization, array $attributes = []): Campaign
    {
        return Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'Campanha de teste',
            'audience_name' => 'Clientes teste',
            'team_name' => 'Growth',
            'channel' => 'whatsapp',
            'status' => 'scheduled',
            'message_count' => 100,
            'delivered_count' => 0,
            'read_count' => 0,
            'failed_count' => 0,
            'spend_amount' => 3000,
            'scheduled_at' => now()->addHour(),
            ...$attributes,
        ]);
    }
}
