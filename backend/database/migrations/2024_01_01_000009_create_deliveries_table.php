<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders')->restrictOnDelete();
            $table->foreignId('delivery_person_id')->constrained('users')->restrictOnDelete();
            $table->string('collector_phone', 20);
            $table->enum('status', ['assigned', 'in_transit', 'delivered', 'failed'])->default('assigned');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('order_id', 'idx_deliveries_order');
            $table->index('delivery_person_id', 'idx_deliveries_delivery_person');
            $table->index('status', 'idx_deliveries_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
