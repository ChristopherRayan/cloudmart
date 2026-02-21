<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Groceries & Food',
                'slug' => 'groceries-food',
                'description' => 'Fresh produce, packaged foods, and cooking essentials for students and staff.',
            ],
            [
                'name' => 'Stationery & Books',
                'slug' => 'stationery-books',
                'description' => 'Notebooks, pens, textbooks, and academic supplies.',
            ],
            [
                'name' => 'Electronics & Accessories',
                'slug' => 'electronics-accessories',
                'description' => 'Phone accessories, chargers, earphones, and laptop accessories.',
            ],
            [
                'name' => 'Personal Care',
                'slug' => 'personal-care',
                'description' => 'Toiletries, hygiene products, and personal grooming items.',
            ],
            [
                'name' => 'Beverages & Snacks',
                'slug' => 'beverages-snacks',
                'description' => 'Soft drinks, water, juices, chips, and quick bites.',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
