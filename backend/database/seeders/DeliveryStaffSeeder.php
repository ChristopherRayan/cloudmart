<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DeliveryStaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update delivery staff user
        $deliveryStaff = User::updateOrCreate(
            [
                'email' => 'delivery@cloudimart.mw',
            ],
            [
                'name' => 'Delivery Staff',
                'password' => Hash::make('password123'),
                'role' => 'delivery_staff',
                'is_active' => true,
                'phone' => '+265999111222', // Default delivery staff phone
                'address' => 'Delivery Department, Cloudimart HQ',
            ]
        );

        $this->command->info('Delivery staff user has been created/updated successfully.');
    }
}