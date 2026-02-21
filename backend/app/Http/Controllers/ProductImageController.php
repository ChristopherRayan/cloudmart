<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductImageController extends Controller
{
    /**
     * POST /api/products/{id}/image
     * Upload product image
     */
    public function upload(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
        ]);

        $product = Product::find($id);

        if (!$product) {
            return $this->error('Product not found.', 404);
        }

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image_url && strpos($product->image_url, 'storage/') !== false) {
                $oldImagePath = str_replace('/storage/', '', $product->image_url);
                if (Storage::disk('public')->exists($oldImagePath)) {
                    Storage::disk('public')->delete($oldImagePath);
                }
            }

            // Store new image
            $path = $request->file('image')->store('product_images', 'public');
            
            // Generate full URL
            $fullUrl = Storage::url($path);
            
            // Update product with new image URL
            $product->image_url = $fullUrl;
            $product->save();

            // Invalidate cache
            Cache::put('products_global_version', microtime(true));
            Cache::forget("products.show.{$id}");

            return $this->success([
                'image_url' => $fullUrl,
                'product' => $product->fresh()
            ], 'Product image uploaded successfully.');
        }

        return $this->error('No image provided.', 400);
    }

    /**
     * DELETE /api/products/{id}/image
     * Remove product image
     */
    public function remove(int $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return $this->error('Product not found.', 404);
        }

        // Delete image file if it's stored locally
        if ($product->image_url && strpos($product->image_url, 'storage/') !== false) {
            $imagePath = str_replace('/storage/', '', $product->image_url);
            if (Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
        }

        // Clear image URL from product
        $product->image_url = null;
        $product->save();

        // Invalidate cache
        Cache::put('products_global_version', microtime(true));
        Cache::forget("products.show.{$id}");

        return $this->success($product->fresh(), 'Product image removed successfully.');
    }
}