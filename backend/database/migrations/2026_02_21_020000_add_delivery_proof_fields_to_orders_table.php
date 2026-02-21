<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'delivery_code')) {
                $table->char('delivery_code', 4)->nullable()->after('order_id');
            }

            if (!Schema::hasColumn('orders', 'delivery_status')) {
                $table->enum('delivery_status', ['pending', 'out_for_delivery', 'delivered'])
                    ->default('pending')
                    ->after('status');
            }

            if (!Schema::hasColumn('orders', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable()->after('delivery_status');
            }

            if (!Schema::hasColumn('orders', 'delivered_by')) {
                $table->unsignedBigInteger('delivered_by')->nullable()->after('delivered_at');
            }
        });

        $this->backfillDeliveryCodes();
        DB::table('orders')->whereNull('delivery_status')->update(['delivery_status' => 'pending']);

        if ($this->isMySql()) {
            DB::statement('ALTER TABLE orders MODIFY delivery_code CHAR(4) NOT NULL');
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->unique('delivery_code', 'orders_delivery_code_unique');
            $table->index('delivery_status', 'idx_orders_delivery_status');
            $table->index('delivered_by', 'idx_orders_delivered_by');
            $table->foreign('delivered_by', 'orders_delivered_by_foreign')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'delivered_by')) {
                $table->dropForeign('orders_delivered_by_foreign');
            }

            $table->dropIndex('idx_orders_delivered_by');
            $table->dropIndex('idx_orders_delivery_status');
            $table->dropUnique('orders_delivery_code_unique');
            $table->dropColumn(['delivery_code', 'delivery_status', 'delivered_at', 'delivered_by']);
        });
    }

    private function backfillDeliveryCodes(): void
    {
        $usedCodes = [];
        $existingCodes = DB::table('orders')
            ->whereNotNull('delivery_code')
            ->pluck('delivery_code')
            ->all();

        foreach ($existingCodes as $code) {
            $usedCodes[(string) $code] = true;
        }

        $ordersWithoutCode = DB::table('orders')
            ->select('id')
            ->whereNull('delivery_code')
            ->orderBy('id')
            ->get();

        foreach ($ordersWithoutCode as $order) {
            $code = $this->generateUniqueCode($usedCodes);

            DB::table('orders')
                ->where('id', $order->id)
                ->update(['delivery_code' => $code]);

            $usedCodes[$code] = true;
        }
    }

    /**
     * @param array<string, bool> $usedCodes
     */
    private function generateUniqueCode(array $usedCodes): string
    {
        for ($attempt = 0; $attempt < 200; $attempt++) {
            $code = (string) random_int(1000, 9999);
            if (!isset($usedCodes[$code])) {
                return $code;
            }
        }

        for ($value = 1000; $value <= 9999; $value++) {
            $code = (string) $value;
            if (!isset($usedCodes[$code])) {
                return $code;
            }
        }

        throw new RuntimeException('Unable to generate a unique 4-digit delivery code.');
    }

    private function isMySql(): bool
    {
        return DB::connection()->getDriverName() === 'mysql';
    }
};
