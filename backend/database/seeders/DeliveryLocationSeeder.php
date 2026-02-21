<?php

namespace Database\Seeders;

use App\Models\DeliveryLocation;
use Illuminate\Database\Seeder;

class DeliveryLocationSeeder extends Seeder
{
    public function run(): void
    {
        DeliveryLocation::create([
            'name' => 'Mzuzu University (Main)',
            'code' => 'MZUNI-01',
            'description' => 'Main campus area including hostels, lecture halls, and library.',
            'polygon_coords' => [
                ['lat' => -11.4582, 'lng' => 34.0125],
                ['lat' => -11.4585, 'lng' => 34.0155],
                ['lat' => -11.4610, 'lng' => 34.0150],
                ['lat' => -11.4605, 'lng' => 34.0120],
            ],
            'latitude' => -11.4596,
            'longitude' => 34.0138,
            'is_active' => true,
        ]);

        DeliveryLocation::create([
            'name' => 'Luwinga Residential',
            'code' => 'LUW-01',
            'description' => 'Luwinga residential area near the university.',
            'polygon_coords' => [
                ['lat' => -11.4520, 'lng' => 34.0080],
                ['lat' => -11.4525, 'lng' => 34.0110],
                ['lat' => -11.4550, 'lng' => 34.0100],
                ['lat' => -11.4545, 'lng' => 34.0070],
            ],
            'latitude' => -11.4535,
            'longitude' => 34.0090,
            'is_active' => true,
        ]);
    }
}
