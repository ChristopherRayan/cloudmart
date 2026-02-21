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
        if (!Schema::hasTable('delivery_zones')) {
            Schema::create('delivery_zones', function (Blueprint $table) {
                $table->id();
                $table->string('zone_name', 150);
                $table->decimal('latitude_center', 10, 8);
                $table->decimal('longitude_center', 11, 8);
                $table->unsignedInteger('radius_meters')->default(100);
                $table->decimal('delivery_fee', 10, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index('zone_name');
                $table->index('is_active');
            });

            return;
        }

        Schema::table('delivery_zones', function (Blueprint $table) {
            if (!Schema::hasColumn('delivery_zones', 'zone_name')) {
                $table->string('zone_name', 150)->after('id');
                $table->index('zone_name');
            }

            if (!Schema::hasColumn('delivery_zones', 'latitude_center')) {
                $table->decimal('latitude_center', 10, 8)->after('zone_name');
            }

            if (!Schema::hasColumn('delivery_zones', 'longitude_center')) {
                $table->decimal('longitude_center', 11, 8)->after('latitude_center');
            }

            if (!Schema::hasColumn('delivery_zones', 'radius_meters')) {
                $table->unsignedInteger('radius_meters')->default(100)->after('longitude_center');
            }

            if (!Schema::hasColumn('delivery_zones', 'delivery_fee')) {
                $table->decimal('delivery_fee', 10, 2)->default(0)->after('radius_meters');
            }

            if (!Schema::hasColumn('delivery_zones', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('delivery_fee');
                $table->index('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('delivery_zones')) {
            return;
        }

        Schema::table('delivery_zones', function (Blueprint $table) {
            if (Schema::hasColumn('delivery_zones', 'is_active')) {
                $table->dropColumn('is_active');
            }

            if (Schema::hasColumn('delivery_zones', 'delivery_fee')) {
                $table->dropColumn('delivery_fee');
            }

            if (Schema::hasColumn('delivery_zones', 'radius_meters')) {
                $table->dropColumn('radius_meters');
            }

            if (Schema::hasColumn('delivery_zones', 'longitude_center')) {
                $table->dropColumn('longitude_center');
            }

            if (Schema::hasColumn('delivery_zones', 'latitude_center')) {
                $table->dropColumn('latitude_center');
            }

            if (Schema::hasColumn('delivery_zones', 'zone_name')) {
                $table->dropColumn('zone_name');
            }
        });
    }
};

