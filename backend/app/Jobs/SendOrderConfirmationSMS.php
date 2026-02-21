<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendOrderConfirmationSMS implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function handle(): void
    {
        // Simulate sending SMS notification to customer
        // In a real application, this would connect to an SMS gateway
        Log::info('Order Confirmation SMS sent', [
            'order_id' => $this->order->order_id,
            'customer_phone' => $this->order->user->phone ?? 'N/A',
            'customer_email' => $this->order->user->email,
        ]);

        // For demo purposes, we'll just log the event
        // In production, integrate with Twilio, Africa's Talking, or another SMS provider
    }
}