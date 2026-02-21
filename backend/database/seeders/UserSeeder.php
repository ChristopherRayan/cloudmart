<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@cloudimart.mw',
            'phone' => '0888000001',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Delivery Staff
        User::create([
            'name' => 'Chisomo Banda',
            'email' => 'delivery@cloudimart.mw',
            'phone' => '0888000002',
            'password' => Hash::make('password123'),
            'role' => 'delivery_staff',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Tamanda Phiri',
            'email' => 'delivery2@cloudimart.mw',
            'phone' => '0888000003',
            'password' => Hash::make('password123'),
            'role' => 'delivery_staff',
            'email_verified_at' => now(),
        ]);

        // Customers
        User::create([
            'name' => 'Mphatso Mwale',
            'email' => 'mphatso@student.mzuni.ac.mw',
            'phone' => '0999100001',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Thandiwe Nyirenda',
            'email' => 'thandiwe@student.mzuni.ac.mw',
            'phone' => '0999100002',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Kondwani Chirwa',
            'email' => 'kondwani@student.mzuni.ac.mw',
            'phone' => '0999100003',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);
    }
}
