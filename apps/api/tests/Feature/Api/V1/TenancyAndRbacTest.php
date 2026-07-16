<?php

namespace Tests\Feature\Api\V1;

use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenancyAndRbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:3000');
    }

    public function test_me_resolves_default_membership_and_persists_valid_selection(): void
    {
        $user = User::factory()->create();
        $first = Organization::factory()->create();
        $second = Organization::factory()->create();
        $first->memberships()->create(['user_id' => $user->id, 'role' => OrganizationRole::Analyst]);
        $second->memberships()->create(['user_id' => $user->id, 'role' => OrganizationRole::Marketing]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $second->id)->getJson('/api/v1/me')
            ->assertOk()->assertJsonPath('data.active_organization.id', $second->id)
            ->assertJsonPath('data.active_organization.role', 'marketing')
            ->assertSessionHas('active_organization_id', $second->id);

        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.active_organization.id', $second->id);
    }

    public function test_unowned_organization_selection_and_resource_are_indistinguishable_404s(): void
    {
        $user = User::factory()->create();
        $own = Organization::factory()->create();
        $foreign = Organization::factory()->create();
        $own->memberships()->create(['user_id' => $user->id, 'role' => OrganizationRole::Owner]);

        $this->actingAs($user)->withHeader('X-Organization-ID', $foreign->id)->getJson('/api/v1/me')->assertNotFound();
        $this->withHeader('X-Organization-ID', $own->id)->getJson("/api/v1/organizations/{$foreign->id}")->assertNotFound();
    }

    public function test_organization_list_contains_only_memberships(): void
    {
        $user = User::factory()->create();
        $own = Organization::factory()->create();
        $foreign = Organization::factory()->create();
        $own->memberships()->create(['user_id' => $user->id, 'role' => OrganizationRole::Admin]);

        $this->actingAs($user)->getJson('/api/v1/organizations')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $own->id)
            ->assertJsonMissing(['id' => $foreign->id]);
    }

    public function test_new_organization_makes_creator_owner(): void
    {
        $user = User::factory()->create();

        $id = $this->actingAs($user)->postJson('/api/v1/organizations', [
            'name' => 'Acme Brasil', 'timezone' => 'America/Sao_Paulo',
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('organization_users', ['organization_id' => $id, 'user_id' => $user->id, 'role' => 'owner']);
    }

    public function test_only_owner_can_update_organization_and_analyst_is_read_only(): void
    {
        [$organization, $owner] = $this->membership(OrganizationRole::Owner);
        [, $analyst] = $this->membership(OrganizationRole::Analyst, $organization);

        $this->actingAs($analyst)->withHeader('X-Organization-ID', $organization->id)
            ->patchJson("/api/v1/organizations/{$organization->id}", ['name' => 'Nope'])->assertForbidden();
        $this->actingAs($owner)->withHeader('X-Organization-ID', $organization->id)
            ->patchJson("/api/v1/organizations/{$organization->id}", ['name' => 'Updated'])->assertOk();
    }

    public function test_admin_can_manage_members_but_cannot_modify_foreign_member(): void
    {
        [$organization] = $this->membership(OrganizationRole::Owner);
        [, $admin] = $this->membership(OrganizationRole::Admin, $organization);
        $foreign = Organization::factory()->create();
        $foreignMember = $foreign->memberships()->create(['user_id' => User::factory()->create()->id, 'role' => OrganizationRole::Analyst]);

        $this->actingAs($admin)->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/organizations/{$organization->id}/members", [
                'name' => 'New Analyst', 'email' => 'ANALYST@EXAMPLE.COM', 'role' => 'analyst',
            ])->assertCreated()
            ->assertJsonPath('data.email', 'analyst@example.com')
            ->assertJsonPath('data.role', 'analyst');
        $this->patchJson("/api/v1/organizations/{$organization->id}/members/{$foreignMember->id}", ['role' => 'marketing'])
            ->assertNotFound();
    }

    public function test_member_invite_rejects_existing_member(): void
    {
        [$organization, $owner] = $this->membership(OrganizationRole::Owner);
        [, $existing] = $this->membership(OrganizationRole::Analyst, $organization);

        $this->actingAs($owner)->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/organizations/{$organization->id}/members", [
                'name' => 'Existing Member', 'email' => mb_strtoupper($existing->email), 'role' => 'marketing',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_last_owner_cannot_be_demoted_or_removed(): void
    {
        [$organization, $owner, $membership] = $this->membership(OrganizationRole::Owner);
        $this->actingAs($owner)->withHeader('X-Organization-ID', $organization->id);

        $this->patchJson("/api/v1/organizations/{$organization->id}/members/{$membership->id}", ['role' => 'admin'])
            ->assertUnprocessable()->assertJsonValidationErrors('role');
        $this->deleteJson("/api/v1/organizations/{$organization->id}/members/{$membership->id}")
            ->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    public function test_email_and_slug_uniqueness_are_case_insensitive(): void
    {
        [$organization, $owner] = $this->membership(OrganizationRole::Owner);
        User::factory()->create(['email' => 'existing@example.com']);
        Organization::factory()->create(['slug' => 'existing-slug']);

        $this->actingAs($owner)->withHeader('X-Organization-ID', $organization->id)
            ->postJson("/api/v1/organizations/{$organization->id}/members", [
                'name' => 'Existing', 'email' => 'EXISTING@EXAMPLE.COM', 'role' => 'analyst',
            ])->assertCreated();
        $this->patchJson("/api/v1/organizations/{$organization->id}", ['slug' => 'EXISTING-SLUG'])
            ->assertUnprocessable()->assertJsonValidationErrors('slug');

        $this->assertSame(1, User::query()->whereRaw('LOWER(email) = ?', ['existing@example.com'])->count());
    }

    /** @return array{Organization, User, OrganizationUser} */
    private function membership(OrganizationRole $role, ?Organization $organization = null): array
    {
        $organization ??= Organization::factory()->create();
        $user = User::factory()->create();
        $membership = $organization->memberships()->create(['user_id' => $user->id, 'role' => $role]);

        return [$organization, $user, $membership];
    }
}
