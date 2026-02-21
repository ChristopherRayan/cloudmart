<?php

namespace App\Services;

use App\Notifications\OrderStatusUpdated;
use App\Services\NotificationService;
use App\Models\Order;
use App\Models\Cart;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;
use App\Models\User;

class OrderService
{
    private NotificationService $notificationService;
    
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Notify user about order status update.
     */
    public function notifyStatusUpdate(Order $order): void
    {
        $order->user->notify(new OrderStatusUpdated($order));
    }

    /**
     * Update order status and notify.
     */
    public function updateStatus(Order $order, string $status, ?string $paymentStatus = null): Order
    {
        $order->update([
            'status' => $status,
            'payment_status' => $paymentStatus ?? $order->payment_status,
        ]);

        $this->notifyStatusUpdate($order);

        return $order->fresh();
    }

    // ... rest of the methods ...
    public function createOrder(
        int $userId,
        int $deliveryLocationId,
        string $paymentMethod,
        ?string $notes = null,
        ?string $customerName = null,
        ?string $customerPhone = null,
        ?string $customerAddress = null,
        ?int $deliveryZoneId = null,
        ?float $deliveryFee = 0
        ): Order
    {
        return DB::transaction(function () use ($userId, $deliveryLocationId, $paymentMethod, $notes, $customerName, $customerPhone, $customerAddress, $deliveryZoneId, $deliveryFee) {
            // ... (cart retrieval and validation logic same as before) ...
            $cart = Cart::where('user_id', $userId)
                ->where('status', 'active')
                ->with('items.product')
                ->first();

            if (!$cart || $cart->items->isEmpty()) {
                throw new \Exception('Your cart is empty.');
            }

            foreach ($cart->items as $item) {
                if (!$item->product->is_active) {
                    throw new \Exception("Product \"{$item->product->name}\" is no longer available.");
                }
                if (!$item->product->hasStock($item->quantity)) {
                    throw new \Exception("Insufficient stock for \"{$item->product->name}\". Available: {$item->product->stock_quantity}");
                }
            }

            $totalAmount = $cart->items->sum(function ($item) {
                    return $item->price * $item->quantity;
                }
                );

                if ($totalAmount < 2000) {
                    throw new \Exception('Minimum order value is MWK 2,000.');
                }

                $orderId = $this->generateOrderId();

                // Calculate total amount including delivery fee
                $finalTotalAmount = $totalAmount + $deliveryFee;
                
                $orderData = [
                    'order_id' => $orderId,
                    'user_id' => $userId,
                    'delivery_location_id' => $deliveryLocationId,
                    'total_amount' => $finalTotalAmount,
                    'status' => 'pending',
                    'payment_status' => 'pending',
                    'payment_method' => $paymentMethod,
                    'notes' => $notes,
                    'customer_name' => $customerName,
                    'customer_phone' => $customerPhone,
                    'customer_address' => $customerAddress,
                ];

                // Keep compatibility with environments where these columns may not be migrated yet.
                if (Schema::hasColumn('orders', 'delivery_zone_id')) {
                    $orderData['delivery_zone_id'] = $deliveryZoneId;
                }

                if (Schema::hasColumn('orders', 'delivery_fee')) {
                    $orderData['delivery_fee'] = $deliveryFee;
                }

                if (Schema::hasColumn('orders', 'delivery_status')) {
                    $orderData['delivery_status'] = 'pending';
                }

                $order = null;
                $maxAttempts = 40;

                for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
                    $currentOrderData = $orderData;

                    if (Schema::hasColumn('orders', 'delivery_code')) {
                        $currentOrderData['delivery_code'] = $this->generateUniqueDeliveryCode();
                    }

                    try {
                        $order = Order::create($currentOrderData);
                        break;
                    } catch (QueryException $exception) {
                        if (!$this->isDeliveryCodeConflict($exception) || $attempt === $maxAttempts) {
                            throw $exception;
                        }
                    }
                }

                if (!$order) {
                    throw new \RuntimeException('Unable to create order due to delivery code generation failure.');
                }

                foreach ($cart->items as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'subtotal' => $item->price * $item->quantity,
                    ]);

                    Product::where('id', $item->product_id)
                        ->decrement('stock_quantity', $item->quantity);
                }

                $cart->update(['status' => 'converted']);

                // Notify about new order
                $this->notifyStatusUpdate($order->load('user'));

                // Keep original notification service call if it does SMS/Email
                $this->notificationService->sendOrderConfirmation($order->load(['user', 'orderItems.product', 'deliveryLocation']));

                return $order;
            });
    }

    /**
     * Generate a unique external order identifier.
     */
    private function generateOrderId(): string
    {
        do {
            $orderId = 'CM-' . Carbon::now()->format('YmdHis') . '-' . str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
        } while (Order::where('order_id', $orderId)->exists());

        return $orderId;
    }

    /**
     * Generate a unique 4-digit delivery confirmation code.
     */
    private function generateUniqueDeliveryCode(): string
    {
        for ($attempt = 0; $attempt < 200; $attempt++) {
            $code = (string) random_int(1000, 9999);

            if (!Order::where('delivery_code', $code)->exists()) {
                return $code;
            }
        }

        for ($value = 1000; $value <= 9999; $value++) {
            $code = (string) $value;
            if (!Order::where('delivery_code', $code)->exists()) {
                return $code;
            }
        }

        throw new \RuntimeException('Unable to generate a unique 4-digit delivery code.');
    }

    private function isDeliveryCodeConflict(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;
        $message = strtolower($exception->getMessage());

        return $sqlState === '23000' && str_contains($message, 'delivery_code');
    }

    public function cancelOrder(Order $order): Order
    {
        if (!$order->isCancellable()) {
            throw new \Exception('This order cannot be cancelled. Only pending or processing orders can be cancelled.');
        }

        return DB::transaction(function () use ($order) {
            foreach ($order->orderItems as $item) {
                Product::where('id', $item->product_id)
                    ->increment('stock_quantity', $item->quantity);
            }

            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'failed',
            ]);

            $this->notifyStatusUpdate($order->load('user'));

            return $order->fresh();
        });
    }
}
