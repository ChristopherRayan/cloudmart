<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendOrderConfirmationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function handle(): void
    {
        // Simulate sending order confirmation email
        // In a real application, this would send an actual email
        Log::info('Order Confirmation Email sent', [
            'order_id' => $this->order->order_id,
            'customer_email' => $this->order->user->email,
        ]);

        // For demo purposes, we'll just log the event
        // In production, use Laravel's Mail facade to send actual emails
    }
}