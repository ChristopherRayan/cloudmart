<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DeliveryAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Order $order)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $locationName = $this->order->deliveryLocation->name
            ?? $this->order->deliveryZone->zone_name
            ?? 'assigned location';

        return [
            'event' => 'delivery_assigned',
            'order_id' => $this->order->order_id,
            'message' => "New delivery assigned: Order {$this->order->order_id} ({$locationName}).",
            'route' => '/delivery/dashboard',
            'timestamp' => now(),
        ];
    }
}
