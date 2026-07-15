<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $status = $request->query('status');
        $team = $request->query('team');

        $contacts = Contact::query()
            ->whereBelongsTo($context->organization())
            ->when(is_string($status) && $status !== '' && $status !== 'all', fn ($query) => $query->where('status', $status))
            ->when(is_string($team) && $team !== '' && $team !== 'all', fn ($query) => $query->where('team_name', $team))
            ->orderByDesc('last_seen_at')
            ->orderBy('name')
            ->get()
            ->map(fn (Contact $contact): array => [
                'id' => $contact->id,
                'name' => $contact->name,
                'phone' => $contact->phone,
                'email' => $contact->email,
                'team_name' => $contact->team_name,
                'status' => $contact->status,
                'tags' => $contact->tags ?? [],
                'last_seen_at' => $contact->last_seen_at?->toISOString(),
            ]);

        return response()->json(['data' => $contacts]);
    }
}
