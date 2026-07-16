<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\ContactImport;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ContactImportController extends Controller
{
    public function index(TenantContext $context): JsonResponse
    {
        $imports = ContactImport::query()
            ->whereBelongsTo($context->organization())
            ->orderByDesc('processed_at')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn (ContactImport $import): array => $this->serialize($import));

        return response()->json(['data' => $imports]);
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        abort_unless($context->membership()->role->canWriteMarketingData(), 403);

        $data = $request->validate([
            'source_name' => ['required', 'string', 'max:140'],
            'team_name' => ['required', 'string', 'max:120'],
            'csv_text' => ['required', 'string', 'max:60000'],
        ]);

        $rows = $this->parseCsv($data['csv_text']);
        if ($rows === []) {
            throw ValidationException::withMessages(['csv_text' => ['Informe ao menos uma linha de contato além do cabeçalho.']]);
        }

        $import = DB::transaction(function () use ($context, $data, $rows): ContactImport {
            $acceptedRows = 0;
            $failureSamples = [];

            foreach ($rows as $row) {
                $line = $row['line'];
                $record = $row['record'];
                $name = trim((string) ($record['name'] ?? ''));
                $phone = trim((string) ($record['phone'] ?? ''));
                $email = trim((string) ($record['email'] ?? ''));
                $status = trim((string) ($record['status'] ?? 'active')) ?: 'active';
                $tags = array_values(array_filter(array_map('trim', explode('|', (string) ($record['tags'] ?? '')))));

                if ($name === '' || $phone === '') {
                    $failureSamples[] = [
                        'line' => $line,
                        'reason' => 'Nome e telefone são obrigatórios.',
                    ];

                    continue;
                }

                Contact::query()->updateOrCreate(
                    ['organization_id' => $context->organization()->id, 'phone' => $phone],
                    [
                        'name' => $name,
                        'email' => $email !== '' ? mb_strtolower($email) : null,
                        'team_name' => $data['team_name'],
                        'status' => in_array($status, ['active', 'inactive'], true) ? $status : 'active',
                        'tags' => $tags,
                        'last_seen_at' => now(),
                    ],
                );
                $acceptedRows++;
            }

            return ContactImport::create([
                'organization_id' => $context->organization()->id,
                'source_name' => $data['source_name'],
                'team_name' => $data['team_name'],
                'status' => count($failureSamples) > 0 ? 'processed_with_errors' : 'processed',
                'total_rows' => count($rows),
                'accepted_rows' => $acceptedRows,
                'failed_rows' => count($failureSamples),
                'failure_samples' => array_slice($failureSamples, 0, 5),
                'processed_at' => now(),
            ]);
        });

        return response()->json(['data' => $this->serialize($import)], 201);
    }

    /**
     * @return list<array{line: int, record: array<string, string|null>}>
     */
    private function parseCsv(string $csvText): array
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($csvText)) ?: [];
        $lines = array_values(array_filter($lines, fn (string $line): bool => trim($line) !== ''));
        if ($lines === []) {
            return [];
        }

        $headers = array_map(
            fn (?string $header): string => mb_strtolower(trim((string) $header)),
            str_getcsv(array_shift($lines)),
        );

        return collect($lines)
            ->take(250)
            ->map(function (string $line, int $index) use ($headers): array {
                $values = str_getcsv($line);
                $record = [];
                foreach ($headers as $columnIndex => $header) {
                    $record[$header] = $values[$columnIndex] ?? null;
                }

                return [
                    'line' => $index + 2,
                    'record' => $record,
                ];
            })
            ->values()
            ->all();
    }

    private function serialize(ContactImport $import): array
    {
        return [
            'id' => $import->id,
            'source_name' => $import->source_name,
            'team_name' => $import->team_name,
            'status' => $import->status,
            'total_rows' => $import->total_rows,
            'accepted_rows' => $import->accepted_rows,
            'failed_rows' => $import->failed_rows,
            'failure_samples' => $import->failure_samples ?? [],
            'processed_at' => $import->processed_at?->toISOString(),
        ];
    }
}
