<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * GET /api/categories
     */
    public function index(): JsonResponse
    {
        $categories = Category::withCount(['products' => function ($query) {
                $query->where('is_active', true);
            }
            ])
            ->orderBy('name')
            ->get();

        return $this->success($categories);
    }

    /**
     * POST /api/categories
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (!isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $data['image_url'] = $this->normalizeImageUrl($data['image_url'] ?? null);

        $category = Category::create($data);

        Cache::forget('categories.all');

        return $this->success($category, 'Category created successfully.', 201);
    }

    /**
     * GET /api/categories/{category}
     */
    public function show(Category $category): JsonResponse
    {
        return $this->success($category);
    }

    /**
     * PUT /api/categories/{category}
     */
    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('image_url', $data)) {
            $data['image_url'] = $this->normalizeImageUrl($data['image_url']);
        }

        $category->update($data);

        Cache::forget('categories.all');

        return $this->success($category, 'Category updated successfully.');
    }

    /**
     * DELETE /api/categories/{category}
     */
    public function destroy(Category $category): JsonResponse
    {
        // Check if category has products
        if ($category->products()->count() > 0) {
            return $this->error('Cannot delete category with associated products.', 400);
        }

        $this->deleteStoredCategoryImage($category->image_url);

        $category->delete();
        
        Cache::forget('categories.all');

        return $this->success(null, 'Category deleted successfully.');
    }

    /**
     * POST /api/categories/{id}/image
     */
    public function uploadImage(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $category = Category::find($id);

        if (!$category) {
            return $this->error('Category not found.', 404);
        }

        if ($request->hasFile('image')) {
            $this->deleteStoredCategoryImage($category->image_url);

            $path = $request->file('image')->store('category_images', 'public');
            $fullUrl = url(Storage::url($path));
            
            $category->image_url = $fullUrl;
            $category->save();

            Cache::forget('categories.all');

            return $this->success([
                'image_url' => $fullUrl,
                'category' => $category
            ], 'Category image uploaded successfully.');
        }

        return $this->error('No image provided.', 400);
    }

    private function normalizeImageUrl(?string $imageUrl): ?string
    {
        if ($imageUrl === null) {
            return null;
        }

        $trimmed = trim($imageUrl);
        if ($trimmed === '') {
            return null;
        }

        if (Str::startsWith($trimmed, 'storage/')) {
            return '/' . $trimmed;
        }

        return $trimmed;
    }

    private function deleteStoredCategoryImage(?string $imageUrl): void
    {
        if (!$imageUrl) {
            return;
        }

        $pathPart = parse_url($imageUrl, PHP_URL_PATH) ?: $imageUrl;
        $relativePath = null;

        if (Str::startsWith($pathPart, '/storage/')) {
            $relativePath = Str::after($pathPart, '/storage/');
        } elseif (Str::startsWith($pathPart, 'storage/')) {
            $relativePath = Str::after($pathPart, 'storage/');
        }

        if ($relativePath && Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }
}
