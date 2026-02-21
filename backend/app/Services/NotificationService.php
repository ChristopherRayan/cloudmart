<?php

namespace App\Services;

use App\Jobs\SendOrderConfirmationEmail;
use App\Jobs\SendOrderConfirmationSMS;
use App\Jobs\SendDeliveryConfirmationSMS;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send order confirmation notifications (email + SMS).
     */
    public function sendOrderConfirmation(Order $order): void
    {
        dispatch(new SendOrderConfirmationEmail($order));
        dispatch(new SendOrderConfirmationSMS($order));
    }

    /**
     * Send delivery confirmation SMS.
     */
    public function sendDeliveryConfirmation(Order $order): void
    {
        dispatch(new SendDeliveryConfirmationSMS($order));
    }

    /**
     * Send order status update notification to customer
     */
    public function sendOrderStatusUpdate(Order $order, string $status): void
    {
        // Log the status update for customer notification
        Log::info('Order status updated for customer', [
            'order_id' => $order->order_id,
            'status' => $status,
            'customer_phone' => $order->user->phone ?? 'N/A',
            'customer_email' => $order->user->email,
        ]);

        // In a real application, this would send an SMS/email notification to the customer
        // For demo purposes, we just log the event
    }
}