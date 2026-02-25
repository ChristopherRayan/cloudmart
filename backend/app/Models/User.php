<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'is_active',
        'profile_image',
        'address',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    protected $appends = ['profile_image_url'];

    public function getProfileImageUrlAttribute(): ?string
    {
        $normalized = $this->normalizeImageReference($this->profile_image, 'profile_images');
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

    // --- Relationships ---

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function activeCart()
    {
        return $this->hasOne(Cart::class)->where('status', 'active');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class , 'delivery_person_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    // --- Helpers ---

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isDeliveryStaff(): bool
    {
        return $this->role === 'delivery_staff';
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }
}
