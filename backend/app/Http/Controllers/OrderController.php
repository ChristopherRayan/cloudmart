<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private
        OrderService $orderService
        )
    {
    }

    /**
     * GET /api/orders
     */
    public function index(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['orderItems.product', 'deliveryLocation', 'delivery'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return $this->success($orders);
    }

    /**
     * GET /api/orders/{orderId}
     */
    public function show(Request $request, string $orderId): JsonResponse
    {
        $order = Order::where('order_id', $orderId)
            ->where('user_id', $request->user()->id)
            ->with(['orderItems.product', 'deliveryLocation', 'delivery.deliveryPerson'])
            ->first();

        if (!$order) {
            return $this->error('Order not found.', 404);
        }

        return $this->success($order);
    }

    /**
     * PATCH /api/orders/{orderId}/cancel
     */
    public function cancel(Request $request, string $orderId): JsonResponse
    {
        $order = Order::where('order_id', $orderId)
            ->where('user_id', $request->user()->id)
            ->with('orderItems')
            ->first();

        if (!$order) {
            return $this->error('Order not found.', 404);
        }

        try {
            $order = $this->orderService->cancelOrder($order);
            return $this->success($order, 'Order cancelled successfully.');
        }
        catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
