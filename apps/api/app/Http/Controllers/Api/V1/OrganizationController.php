<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrganizationRole;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $organizations = $request->user()->memberships()
            ->with('organization')
            ->orderBy('organization_id')
            ->get()
            ->map(fn ($membership): array => [
                'id' => $membership->organization->id,
                'name' => $membership->organization->name,
                'slug' => $membership->organization->slug,
                'timezone' => $membership->organization->timezone,
                'role' => $membership->role->value,
            ]);

        return response()->json(['data' => $organizations]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'timezone' => ['required', 'timezone:all'],
        ]);

        $organization = DB::transaction(function () use ($data, $request): Organization {
            $baseSlug = Str::slug($data['name']) ?: 'organization';
            $slug = $baseSlug;
            $suffix = 2;
            while (Organization::where('slug', $slug)->exists()) {
                $slug = $baseSlug.'-'.$suffix++;
            }
            $organization = Organization::create([...$data, 'slug' => $slug]);
            $organization->memberships()->create([
                'user_id' => $request->user()->id,
                'role' => OrganizationRole::Owner,
            ]);

            return $organization;
        });

        return response()->json(['data' => $organization], 201);
    }

    public function show(Organization $organization, TenantContext $context): JsonResponse
    {
        abort_unless($organization->is($context->organization()), 404);

        return response()->json(['data' => $organization]);
    }

    public function update(Request $request, Organization $organization, TenantContext $context): JsonResponse
    {
        abort_unless($organization->is($context->organization()), 404);
        $this->authorize('update', $organization);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'timezone' => ['sometimes', 'required', 'timezone:all'],
            'slug' => ['sometimes', 'required', 'string', 'max:120'],
        ]);
        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
            $exists = Organization::query()->whereRaw('LOWER(slug) = ?', [mb_strtolower($data['slug'])])
                ->whereKeyNot($organization->id)->exists();
            if ($exists) {
                throw ValidationException::withMessages(['slug' => ['The slug has already been taken.']]);
            }
        }
        $organization->update($data);

        return response()->json(['data' => $organization]);
    }
}
