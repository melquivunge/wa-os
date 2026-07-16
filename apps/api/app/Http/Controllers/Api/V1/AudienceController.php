<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Audience;
use App\Models\Contact;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AudienceController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $team = $request->query('team');

        $audiences = Audience::query()
            ->whereBelongsTo($context->organization())
            ->when(is_string($team) && $team !== '' && $team !== 'all', fn ($query) => $query->where('team_name', $team))
            ->orderByDesc('contact_count')
            ->orderBy('name')
            ->get()
            ->map(fn (Audience $audience): array => $this->serialize($audience));

        return response()->json(['data' => $audiences]);
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        abort_unless($context->membership()->role->canWriteMarketingData(), 403);

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:140',
                Rule::unique('audiences', 'name')->where(fn ($query) => $query->where('organization_id', $context->organization()->id)),
            ],
            'team_name' => ['required', 'string', 'max:120'],
            'status' => ['required', Rule::in(['all', 'active', 'inactive'])],
            'tag' => ['nullable', 'string', 'max:80'],
        ]);

        $contacts = Contact::query()
            ->whereBelongsTo($context->organization())
            ->where('team_name', $data['team_name'])
            ->when($data['status'] !== 'all', fn ($query) => $query->where('status', $data['status']))
            ->get();

        if (isset($data['tag']) && trim($data['tag']) !== '') {
            $tag = trim($data['tag']);
            $contacts = $contacts->filter(fn (Contact $contact): bool => in_array($tag, $contact->tags ?? [], true));
        }

        $contactCount = $contacts->count();
        if ($contactCount === 0) {
            throw ValidationException::withMessages([
                'team_name' => ['Nenhum contato corresponde aos filtros escolhidos.'],
            ]);
        }

        $rules = [
            $data['team_name'],
            $data['status'] === 'all' ? 'Todos os status' : ($data['status'] === 'active' ? 'Somente ativos' : 'Somente inativos'),
        ];
        if (isset($tag) && $tag !== '') {
            $rules[] = "Tag: {$tag}";
        }

        $audience = Audience::create([
            'organization_id' => $context->organization()->id,
            'name' => $data['name'],
            'team_name' => $data['team_name'],
            'source' => 'Construtor demo',
            'contact_count' => $contactCount,
            'estimated_spend_amount' => $contactCount * 30,
            'rules' => $rules,
            'refreshed_at' => now(),
        ]);

        return response()->json(['data' => $this->serialize($audience)], 201);
    }

    private function serialize(Audience $audience): array
    {
        return [
            'id' => $audience->id,
            'name' => $audience->name,
            'team_name' => $audience->team_name,
            'source' => $audience->source,
            'contact_count' => $audience->contact_count,
            'estimated_spend_amount' => $audience->estimated_spend_amount,
            'rules' => $audience->rules ?? [],
            'refreshed_at' => $audience->refreshed_at?->toISOString(),
        ];
    }
}
