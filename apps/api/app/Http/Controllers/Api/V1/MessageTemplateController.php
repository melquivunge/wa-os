<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageTemplateController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $status = $request->query('status');
        $team = $request->query('team');
        $category = $request->query('category');

        $templates = MessageTemplate::query()
            ->whereBelongsTo($context->organization())
            ->when(is_string($status) && $status !== '' && $status !== 'all', fn ($query) => $query->where('status', $status))
            ->when(is_string($team) && $team !== '' && $team !== 'all', fn ($query) => $query->where('team_name', $team))
            ->when(is_string($category) && $category !== '' && $category !== 'all', fn ($query) => $query->where('category', $category))
            ->orderByRaw("status = 'approved' desc")
            ->orderBy('name')
            ->get()
            ->map(fn (MessageTemplate $template): array => [
                'id' => $template->id,
                'name' => $template->name,
                'team_name' => $template->team_name,
                'category' => $template->category,
                'status' => $template->status,
                'language' => $template->language,
                'body' => $template->body,
                'last_used_at' => $template->last_used_at?->toISOString(),
            ]);

        return response()->json(['data' => $templates]);
    }
}
