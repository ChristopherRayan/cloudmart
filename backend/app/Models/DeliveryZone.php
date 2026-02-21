<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryZone extends Model
{
    use HasFactory;

    protected $fillable = [
        'zone_name',
        'latitude_center',
        'longitude_center',
        'radius_meters',
        'delivery_fee',
        'is_active',
    ];

    protected $casts = [
        'latitude_center' => 'decimal:8',
        'longitude_center' => 'decimal:8',
        'radius_meters' => 'integer',
        'delivery_fee' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
