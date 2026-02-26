<?php

namespace App\Http\Controllers;

use App\Http\Requests\VerifyHandshakeRequest;
use App\Models\Delivery;
use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeliveryController extends Controller
{
    public function __construct(private
        NotificationService $notificationService
        )
    {
    }

    /**
     * GET /api/delivery/assigned
     */
    public function assigned(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->get('limit', 12), 25));

        $deliveries = Delivery::where('delivery_person_id', $request->user()->id)
            ->whereIn('status', ['assigned', 'in_transit'])
            ->select([
                'id',
                'order_id',
                'delivery_person_id',
                'collector_phone',
                'status',
                'assigned_at',
                'picked_up_at',
                'delivered_at',
            ])
            ->with([
                'order' => function ($query) {
                    $query->select([
                        'id',
                        'order_id',
                        'user_id',
                        'delivery_location_id',
                        'customer_name',
                        'customer_phone',
                        'total_amount',
                        'notes',
                        'created_at',
                    ])
                    ->withCount('orderItems')
                    ->with([
                        'user:id,name,phone',
                        'deliveryLocation:id,name,description,latitude,longitude',
                    ]);
                },
            ])
            ->orderBy('assigned_at', 'desc')
            ->limit($limit)
            ->get();

        return $this->success($deliveries);
    }

    /**
     * PATCH /api/delivery/{deliveryId}/start
     * Mark an assigned delivery as started.
     */
    public function startDelivery(Request $request, int $deliveryId): JsonResponse
    {
        $delivery = Delivery::with('order')->find($deliveryId);

        if (!$delivery) {
            return $this->error('Delivery task not found.', 404);
        }

        if ($delivery->delivery_person_id !== $request->user()->id) {
            return $this->error('You are not assigned to this delivery task.', 403);
        }

        if ($delivery->status !== 'assigned') {
            return $this->error('Delivery task has already been started or completed.', 422);
        }

        if (!$delivery->order || in_array($delivery->order->status, ['cancelled', 'delivered'])) {
            return $this->error('Order cannot be moved to transit from its current status.', 422);
        }

        $delivery->update([
            'status' => 'in_transit',
            'picked_up_at' => now(),
        ]);

        $delivery->order->update([
            'status' => 'out_for_delivery',
            'delivery_status' => 'out_for_delivery',
        ]);

        $this->notificationService->sendOrderStatusUpdate(
            $delivery->order->fresh(['user']),
            'out_for_delivery'
        );

        return $this->success([
            'order' => $delivery->order->fresh(['orderItems.product', 'deliveryLocation', 'delivery.deliveryPerson']),
            'delivery' => $delivery->fresh(),
        ], 'Delivery started successfully.');
    }

    /**
     * POST /api/delivery/verify
     * Delivery proof verification with order ID + 4-digit code.
     */
    public function verifyHandshake(VerifyHandshakeRequest $request): JsonResponse
    {
        $order = Order::where('order_id', strtoupper($request->order_id))
            ->with(['user', 'delivery'])
            ->first();

        if (!$order) {
            Log::warning('Delivery verification failed: order not found', [
                'order_id' => $request->order_id,
                'delivery_person_id' => $request->user()->id,
            ]);
            return $this->error('Order not found.', 404);
        }

        if ($order->status === 'cancelled') {
            return $this->error('This order was cancelled and cannot be verified.', 422);
        }

        if ($order->status === 'delivered') {
            return $this->error('This order has already been delivered.', 422);
        }

        if ($order->delivery_status === 'delivered') {
            return $this->error('This order has already been delivered.', 422);
        }

        if (!$order->delivery) {
            return $this->error('Order has not been assigned to delivery staff yet.', 422);
        }

        if ($order->delivery->delivery_person_id !== $request->user()->id) {
            return $this->error('This order is assigned to another delivery staff member.', 403);
        }

        if ($order->delivery->status !== 'in_transit') {
            return $this->error('Please start delivery before confirming completion.', 422);
        }

        if ($order->delivery_status !== 'out_for_delivery') {
            return $this->error('Order is not out for delivery.', 422);
        }

        if ((string) $order->delivery_code !== (string) $request->delivery_code) {
            Log::warning('Delivery verification failed: invalid code', [
                'order_id' => $request->order_id,
                'delivery_person_id' => $request->user()->id,
            ]);

            return $this->error('Invalid delivery code.', 422);
        }

        DB::transaction(function () use ($order, $request): void {
            $order->update([
                'status' => 'delivered',
                'delivery_status' => 'delivered',
                'payment_status' => 'completed',
                'delivered_at' => now(),
                'delivered_by' => $request->user()->id,
            ]);

            $order->delivery()->update([
                'status' => 'delivered',
                'collector_phone' => $order->customer_phone ?: $order->user?->phone,
                'delivered_at' => now(),
            ]);
        });

        $order = $order->fresh(['user', 'deliveryLocation', 'orderItems.product', 'delivery']);

        $this->notificationService->sendDeliveryConfirmation($order);
        $this->notificationService->sendOrderStatusUpdate($order, 'delivered');

        Log::info('Delivery verified successfully', [
            'order_id' => $order->order_id,
            'delivery_person_id' => $request->user()->id,
        ]);

        return $this->success([
            'order' => $order,
            'delivery' => $order->delivery,
        ], 'Delivery verified successfully!');
    }

    /**
     * GET /api/delivery/history
     */
    public function history(Request $request): JsonResponse
    {
        $deliveries = Delivery::where('delivery_person_id', $request->user()->id)
            ->with(['order.user', 'order.deliveryLocation'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return $this->success($deliveries);
    }
}
