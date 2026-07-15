<?php

namespace App\Http\Middleware;

use App\Models\OrganizationUser;
use App\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next): Response
    {
        $query = OrganizationUser::query()
            ->where('user_id', $request->user()->getKey())
            ->with('organization')
            ->orderBy('organization_id');

        $requestedId = $request->header('X-Organization-ID') ?? $request->session()->get('active_organization_id');

        if ($requestedId !== null) {
            $query->where('organization_id', $requestedId);
        }

        $membership = $query->first();

        if ($membership === null) {
            return new JsonResponse(['message' => 'Organization not found.'], 404);
        }

        $request->session()->put('active_organization_id', $membership->organization_id);

        $this->context->set($membership);
        $request->attributes->set(TenantContext::class, $this->context);

        return $next($request);
    }
}
