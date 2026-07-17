<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('whatsapp_account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider', 40)->default('meta');
            $table->string('provider_event_id', 180)->nullable();
            $table->json('payload');
            $table->json('headers')->nullable();
            $table->string('status', 30)->default('received');
            $table->text('processing_error')->nullable();
            $table->timestampTz('received_at');
            $table->timestampTz('processed_at')->nullable();
            $table->timestamps();

            $table->index(['provider', 'provider_event_id']);
            $table->index(['organization_id', 'received_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
