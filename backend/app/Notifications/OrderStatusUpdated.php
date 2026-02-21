<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderStatusUpdated extends Notification
{
    use Queueable;

    public function __construct(protected Order $order)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $statusMessages = [
            'pending' => 'Your order is pending confirmation.',
            'processing' => 'Your order is being processed.',
            'out_for_delivery' => 'Your order is out for delivery! A staff member is on their way.',
            'delivered' => 'Your order has been delivered successfully. Thank you for shopping!',
            'cancelled' => 'Your order has been cancelled.',
        ];

        return [
            'order_id' => $this->order->order_id,
            'status' => $this->order->status,
            'message' => $statusMessages[$this->order->status] ?? 'Your order status has been updated.',
            'timestamp' => now(),
        ];
    }
}
