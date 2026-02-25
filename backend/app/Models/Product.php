<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    protected $appends = [
        'image_url_full',
    ];

    public function getImageUrlFullAttribute()
    {
        if ($this->image_url) {
            // If it's already a full URL, return as is
            if (filter_var($this->image_url, FILTER_VALIDATE_URL)) {
                return $this->image_url;
            }
            
            // If it's a relative path, generate full URL
            if (str_starts_with($this->image_url, '/storage/') || str_starts_with($this->image_url, 'storage/')) {
                return asset($this->image_url);
            }
            return asset('storage/' . $this->image_url);
        }
        
        return null;
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
