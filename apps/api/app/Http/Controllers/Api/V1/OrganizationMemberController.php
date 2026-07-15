<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrganizationRole;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrganizationMemberController extends Controller
{
    public function index(Organization $organization, TenantContext $context): JsonResponse
    {
        $this->assertActive($organization, $context);

        $members = $organization->memberships()->with('user:id,name,email')->orderBy('created_at')->get()
            ->map(fn (OrganizationUser $membership): array => [
                'id' => $membership->id,
                'name' => $membership->user->name,
                'email' => $membership->user->email,
                'role' => $membership->role->value,
            ]);

        return response()->json(['data' => $members]);
    }

    public function store(Request $request, Organization $organization, TenantContext $context): JsonResponse
    {
        $this->assertActive($organization, $context);
        $this->authorize('manageMembers', $organization);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email'],
            'role' => ['required', Rule::enum(OrganizationRole::class)],
        ]);
        $email = mb_strtolower($data['email']);

        $membership = DB::transaction(function () use ($data, $email, $organization): OrganizationUser {
            $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();
            $user ??= User::create([
                'email' => $email,
                'name' => $data['name'],
                'password' => Hash::make(Str::random(64)),
            ]);

            return $organization->memberships()->create([
                'user_id' => $user->id,
                'role' => $data['role'],
            ]);
        });

        return response()->json(['data' => $membership->load('user:id,name,email')], 201);
    }

    public function update(Request $request, Organization $organization, OrganizationUser $member, TenantContext $context): JsonResponse
    {
        $this->assertActiveMember($organization, $member, $context);
        $this->authorize('manageMembers', $organization);
        $data = $request->validate(['role' => ['required', Rule::enum(OrganizationRole::class)]]);

        DB::transaction(function () use ($member, $data, $organization): void {
            $locked = OrganizationUser::query()->lockForUpdate()->findOrFail($member->id);
            $this->guardLastOwner($organization, $locked, OrganizationRole::from($data['role']));
            $locked->update(['role' => $data['role']]);
        });

        return response()->json(['data' => $member->fresh()]);
    }

    public function destroy(Organization $organization, OrganizationUser $member, TenantContext $context): JsonResponse
    {
        $this->assertActiveMember($organization, $member, $context);
        $this->authorize('manageMembers', $organization);

        DB::transaction(function () use ($member, $organization): void {
            $locked = OrganizationUser::query()->lockForUpdate()->findOrFail($member->id);
            $this->guardLastOwner($organization, $locked, null);
            $locked->delete();
        });

        return response()->json(null, 204);
    }

    private function assertActive(Organization $organization, TenantContext $context): void
    {
        abort_unless($organization->is($context->organization()), 404);
    }

    private function assertActiveMember(Organization $organization, OrganizationUser $member, TenantContext $context): void
    {
        $this->assertActive($organization, $context);
        abort_unless($member->organization_id === $organization->id, 404);
    }

    private function guardLastOwner(Organization $organization, OrganizationUser $member, ?OrganizationRole $newRole): void
    {
        if ($member->role !== OrganizationRole::Owner || $newRole === OrganizationRole::Owner) {
            return;
        }

        $ownerCount = $organization->memberships()
            ->where('role', OrganizationRole::Owner->value)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->count();

        if ($ownerCount <= 1) {
            throw ValidationException::withMessages(['role' => ['An organization must always have at least one owner.']]);
        }
    }
}
