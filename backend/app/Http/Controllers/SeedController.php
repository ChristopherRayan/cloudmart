<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeedController extends Controller
{
    /**
     * POST /api/seed/products
     * Seed products for development and testing
     */
    public function seedProducts(Request $request): JsonResponse
    {
        try {
            // Check if products already exist
            if (\App\Models\Product::count() > 0) {
                return $this->error('Products already exist. Use admin panel to manage products.', 400);
            }

            // Run the product seeder
            \Artisan::call('db:seed', [
                '--class' => 'ProductSeeder'
            ]);

            $productCount = \App\Models\Product::count();
            
            return $this->success([
                'message' => 'Products seeded successfully',
                'product_count' => $productCount
            ], 'Products seeded successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to seed products: ' . $e->getMessage(), 500);
        }
    }
}