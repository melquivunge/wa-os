<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_imports', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('source_name', 140);
            $table->string('team_name', 120);
            $table->string('status', 30)->default('processed');
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('accepted_rows')->default(0);
            $table->unsignedInteger('failed_rows')->default(0);
            $table->json('failure_samples')->nullable();
            $table->timestampTz('processed_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'processed_at']);
            $table->index(['organization_id', 'team_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_imports');
    }
};
