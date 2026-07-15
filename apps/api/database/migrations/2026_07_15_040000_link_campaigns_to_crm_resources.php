<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->foreignUuid('audience_id')->nullable()->after('organization_id')->constrained()->nullOnDelete();
            $table->foreignUuid('message_template_id')->nullable()->after('audience_id')->constrained()->nullOnDelete();

            $table->index(['organization_id', 'audience_id']);
            $table->index(['organization_id', 'message_template_id']);
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->dropIndex(['organization_id', 'audience_id']);
            $table->dropIndex(['organization_id', 'message_template_id']);
            $table->dropConstrainedForeignId('message_template_id');
            $table->dropConstrainedForeignId('audience_id');
        });
    }
};
