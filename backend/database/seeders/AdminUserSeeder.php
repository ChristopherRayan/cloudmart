<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update admin user
        $admin = User::updateOrCreate(
            [
                'email' => 'admin@cloudimart.mw',
            ],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
                'phone' => '+265999888777', // Default admin phone
                'address' => 'Admin Office, Cloudimart HQ',
            ]
        );

        $this->command->info('Admin user has been created/updated successfully.');
    }
}