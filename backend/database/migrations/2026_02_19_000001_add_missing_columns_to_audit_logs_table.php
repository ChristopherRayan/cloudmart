<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            $table->string('user_name')->after('user_id');
            $table->string('user_email')->after('user_name');
            $table->string('action')->after('user_email');          // login, logout, create, update, delete, view
            $table->string('resource_type')->after('action');       // user, order, product, settings, etc.
            $table->string('resource_id')->nullable()->after('resource_type');
            $table->text('description')->nullable()->after('resource_id');
            $table->string('ip_address', 45)->nullable()->after('description');
            $table->text('user_agent')->nullable()->after('ip_address');

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['action', 'created_at']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropIndex(['action', 'created_at']);
            $table->dropIndex(['user_id']);
            $table->dropColumn([
                'user_id', 'user_name', 'user_email',
                'action', 'resource_type', 'resource_id',
                'description', 'ip_address', 'user_agent',
            ]);
        });
    }
};
