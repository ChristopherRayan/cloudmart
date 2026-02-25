<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    /**
     * GET /api/products
     * List products with pagination, filtering by category, search, active status.
     */
    public function index(Request $request): JsonResponse
    {
        $categoryId = $request->get('category_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = strtolower((string) $request->get('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $page = max((int) $request->get('page', 1), 1);
        $perPage = max(1, min((int) $request->get('per_page', 20), 100));

        $allowedSorts = ['created_at', 'price', 'name', 'stock_quantity'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }

        // Get global product version for cache invalidation
        $globalVersion = Cache::get('products_global_version', 0);

        $cacheKey = "products.index.{$globalVersion}.{$categoryId}.{$search}.{$sortBy}.{$sortDir}.{$page}.{$perPage}";

        $products = Cache::remember($cacheKey, 3600, function () use ($request, $sortBy, $sortDir, $perPage) {
            $query = Product::query()
                ->select([
                    'id',
                    'category_id',
                    'name',
                    'slug',
                    'description',
                    'price',
                    'discount_price',
                    'discount_end_at',
                    'stock_quantity',
                    'image_url',
                    'is_active',
                    'is_featured',
                    'created_at',
                ])
                ->with(['category:id,name,slug,image_url'])
                ->active();

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            $query->orderBy($sortBy, $sortDir);

            return $query->paginate($perPage);
        });

        return $this->success($products);
    }

    /**
     * GET /api/products/{id}
     */
    public function show(int $id): JsonResponse
    {
        $product = Cache::remember("products.show.{$id}", 3600, function () use ($id) {
            return Product::query()
                ->select([
                    'id',
                    'category_id',
                    'name',
                    'slug',
                    'description',
                    'price',
                    'discount_price',
                    'discount_end_at',
                    'stock_quantity',
                    'image_url',
                    'is_active',
                    'is_featured',
                    'created_at',
                ])
                ->with(['category:id,name,slug,image_url'])
                ->find($id);
        });

        if (!$product) {
            return $this->error('Product not found.', 404);
        }

        return $this->success($product);
    }

    /**
     * POST /api/products (admin only)
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        $this->clearProductCache();

        return $this->success($product->load('category'), 'Product created successfully.', 201);
    }

    /**
     * PUT /api/products/{id} (admin only)
     */
    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return $this->error('Product not found.', 404);
        }

        $product->update($request->validated());

        $this->clearProductCache($id);

        return $this->success($product->load('category'), 'Product updated successfully.');
    }

    /**
     * DELETE /api/products/{id} (admin only)
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return $this->error('Product not found.', 404);
        }

        // Check if product has order items (RESTRICT)
        if ($product->orderItems()->exists()) {
            return $this->error('Cannot delete product with existing orders.', 422);
        }

        $product->delete();

        $this->clearProductCache($id);

        return response()->json(null, 204);
    }

    /**
     * Clear product related cache.
     */
    private function clearProductCache(?int $id = null): void
    {
        // Update global version to invalidate all list caches
        Cache::put('products_global_version', microtime(true));

        if ($id) {
            Cache::forget("products.show.{$id}");
        }
    }
}
