<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request, TenantContext $context): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'active_organization' => [
                    'id' => $context->organization()->id,
                    'name' => $context->organization()->name,
                    'slug' => $context->organization()->slug,
                    'timezone' => $context->organization()->timezone,
                    'role' => $context->membership()->role->value,
                ],
            ],
        ]);
    }
}
