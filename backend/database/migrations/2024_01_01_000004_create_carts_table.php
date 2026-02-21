<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('session_id', 255)->nullable();
            $table->enum('status', ['active', 'abandoned', 'converted'])->default('active');
            $table->timestamps();

            $table->index('user_id', 'idx_carts_user');
            $table->index('session_id', 'idx_carts_session');
            $table->index('status', 'idx_carts_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
