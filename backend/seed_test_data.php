<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Category;
use App\Models\Product;

echo "Seeding test data...\n";

// 1. Create Category
$category = Category::create([
    'name' => 'Test Category ' . time(),
    'slug' => 'test-cat-' . time(),
]);
echo "Created Category: " . $category->id . "\n";

// 2. Create Featured Product
$featured = Product::create([
    'name' => 'Featured Product',
    'slug' => 'featured-prod-' . time(),
    'description' => 'A featured product',
    'price' => 10000,
    'stock_quantity' => 10,
    'category_id' => $category->id,
    'is_active' => true,
    'is_featured' => true,
    'image_url' => 'http://placehold.it/300'
]);
echo "Created Featured Product: " . $featured->id . "\n";

// 3. Create Discounted Product
$discounted = Product::create([
    'name' => 'Discounted Product',
    'slug' => 'discount-prod-' . time(),
    'description' => 'A discounted product',
    'price' => 20000,
    'discount_price' => 15000,
    'stock_quantity' => 10,
    'category_id' => $category->id,
    'is_active' => true,
    'is_featured' => false,
    'image_url' => 'http://placehold.it/300'
]);
echo "Created Discounted Product: " . $discounted->id . "\n";

echo "Done.\n";
