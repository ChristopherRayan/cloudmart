<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'user_id',
        'delivery_location_id',
        'delivery_zone_id',
        'delivery_fee',
        'delivery_code',
        'delivery_status',
        'delivered_at',
        'delivered_by',
        'total_amount',
        'status',
        'payment_status',
        'payment_method',
        'transaction_reference',
        'notes',
        'customer_name',
        'customer_phone',
        'customer_address',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'delivered_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function deliveryLocation()
    {
        return $this->belongsTo(DeliveryLocation::class);
    }

    public function deliveryZone()
    {
        return $this->belongsTo(DeliveryZone::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function deliveredBy()
    {
        return $this->belongsTo(User::class, 'delivered_by');
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class);
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, ['pending', 'processing']);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
