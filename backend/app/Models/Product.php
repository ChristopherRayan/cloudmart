<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
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
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'discount_end_at' => 'datetime',
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    public function getImageUrlAttribute(?string $value): ?string
    {
        $normalized = $this->normalizeImageReference($value, 'product_images');
        if (!$normalized) {
            return null;
        }

        if (Str::startsWith($normalized, '/storage/')) {
            $relativePath = ltrim(Str::after($normalized, '/storage/'), '/');
            if (!Storage::disk('public')->exists($relativePath)) {
                return null;
            }
        }

        return $normalized;
    }

    public function getImageUrlFullAttribute(): ?string
    {
        return $this->image_url;
    }

    private function normalizeImageReference(?string $value, string $defaultDirectory): ?string
    {
        if (!$value) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        if (filter_var($trimmed, FILTER_VALIDATE_URL)) {
            $path = parse_url($trimmed, PHP_URL_PATH);
            if ($path && (Str::startsWith($path, '/storage/') || Str::startsWith($path, 'storage/'))) {
                $trimmed = $path;
            } else {
                return $trimmed;
            }
        }

        if (Str::startsWith($trimmed, '/storage/')) {
            return $trimmed;
        }

        if (Str::startsWith($trimmed, 'storage/')) {
            return '/' . ltrim($trimmed, '/');
        }

        if (Str::contains($trimmed, '/')) {
            return '/storage/' . ltrim($trimmed, '/');
        }

        return '/storage/' . trim($defaultDirectory, '/') . '/' . ltrim($trimmed, '/');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function isInStock(): bool
    {
        return $this->stock_quantity > 0;
    }

    public function hasStock(int $quantity): bool
    {
        return $this->stock_quantity >= $quantity;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }
}
