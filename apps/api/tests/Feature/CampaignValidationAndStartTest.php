<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\Audience;
use App\Models\Campaign;
use App\Models\MessageTemplate;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CampaignValidationAndStartTest extends TestCase
{
    use RefreshDatabase;

    public function test_marketing_user_can_validate_and_start_a_ready_campaign(): void
    {
        [$organization, $user] = $this->createMember(OrganizationRole::Marketing);
        [$audience, $template] = $this->createReadyResources($organization);
        $campaign = $this->createCampaign($organization, [
            'audience_id' => $audience->id,
            'message_template_id' => $template->id,
            'message_count' => $audience->contact_count,
            'status' => 'scheduled',
        ]);

        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/validate")
            ->assertOk()
            ->assertJsonPath('data.ready', true)
            ->assertJsonPath('data.errors', []);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/start")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.timeline.2.state', 'done');

        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'status' => 'completed',
        ]);
        $campaign->refresh();
        $this->assertNotNull($campaign->started_at);
        $this->assertNotNull($campaign->completed_at);
        $this->assertSame($campaign->message_count, $campaign->delivered_count + $campaign->failed_count);
        $this->assertGreaterThan(0, $campaign->read_count);
        $this->assertSame(12, $campaign->recipients()->count());
    }

    public function test_start_rejects_campaign_with_unapproved_template(): void
    {
        [$organization, $user] = $this->createMember(OrganizationRole::Marketing);
        [$audience, $template] = $this->createReadyResources($organization, templateStatus: 'draft');
        $campaign = $this->createCampaign($organization, [
            'audience_id' => $audience->id,
            'message_template_id' => $template->id,
            'message_count' => $audience->contact_count,
            'status' => 'scheduled',
        ]);

        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/start")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('message_template_id');

        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'status' => 'scheduled',
        ]);
    }

    public function test_analyst_cannot_validate_or_start_campaign(): void
    {
        [$organization, $user] = $this->createMember(OrganizationRole::Analyst);
        [$audience, $template] = $this->createReadyResources($organization);
        $campaign = $this->createCampaign($organization, [
            'audience_id' => $audience->id,
            'message_template_id' => $template->id,
        ]);

        Sanctum::actingAs($user);

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/validate")
            ->assertForbidden();

        $this->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/campaigns/{$campaign->id}/start")
            ->assertForbidden();
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

    /** @return array{Audience, MessageTemplate} */
    private function createReadyResources(Organization $organization, string $templateStatus = 'approved'): array
    {
        $audience = Audience::create([
            'organization_id' => $organization->id,
            'name' => 'Clientes prontos',
            'team_name' => 'Growth',
            'source' => 'Segmento dinâmico',
            'contact_count' => 120,
            'estimated_spend_amount' => 3600,
            'rules' => ['Ativos'],
            'refreshed_at' => now(),
        ]);
        $template = MessageTemplate::create([
            'organization_id' => $organization->id,
            'name' => 'Boas-vindas',
            'team_name' => 'Growth',
            'category' => 'marketing',
            'status' => $templateStatus,
            'language' => 'pt_BR',
            'body' => 'Olá {{nome}}, temos novidades.',
        ]);

        return [$audience, $template];
    }

    /** @param array<string, mixed> $attributes */
    private function createCampaign(Organization $organization, array $attributes = []): Campaign
    {
        return Campaign::create([
            'organization_id' => $organization->id,
            'name' => 'Campanha pronta',
            'audience_name' => 'Clientes prontos',
            'team_name' => 'Growth',
            'channel' => 'whatsapp',
            'status' => 'scheduled',
            'message_count' => 120,
            'delivered_count' => 0,
            'read_count' => 0,
            'failed_count' => 0,
            'spend_amount' => 3600,
            'scheduled_at' => now()->addHour(),
            ...$attributes,
        ]);
    }
}
