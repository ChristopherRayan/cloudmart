<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Services\OrderService;
use App\Services\DeliveryZoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    public function __construct(
        private OrderService $orderService,
        private DeliveryZoneService $deliveryZoneService
        )
    {
    }

    /**
     * POST /api/checkout
     * Geofence middleware runs before this controller.
     */
    public function process(CheckoutRequest $request): JsonResponse
    {
        try {
            $allowDevBypass = app()->environment('local') && $request->filled('delivery_location_id');

            // Validate GPS accuracy if provided
            if ($request->has('accuracy') && $request->accuracy > 100) {
                return $this->error('GPS accuracy is too low. Please ensure accuracy is within 100 meters.', 422);
            }

            $deliveryZone = $request->attributes->get('geofence_zone');

            if (!$deliveryZone && is_numeric($request->latitude) && is_numeric($request->longitude)) {
                $deliveryZone = $this->deliveryZoneService->findValidDeliveryZone(
                    (float) $request->latitude,
                    (float) $request->longitude
                );
            }

            if (!$deliveryZone && $allowDevBypass) {
                // Development fallback: allow checkout based on selected location even without GPS geofence match.
                $deliveryZone = [
                    'zone_id' => null,
                    'zone_name' => null,
                    'delivery_fee' => 0,
                    'distance' => null,
                    'bypassed' => true,
                ];
            }

            if (!$deliveryZone) {
                return $this->error('Delivery is not available in your location.', 422);
            }
            
            // Create order with delivery zone information
            $order = $this->orderService->createOrder(
                $request->user()->id,
                $request->delivery_location_id,
                $request->payment_method,
                $request->notes,
                $request->customer_name,
                $request->customer_phone,
                $request->customer_address,
                $deliveryZone['zone_id'],
                $deliveryZone['delivery_fee']
            );

            return $this->success([
                'order' => $order->load(['orderItems.product', 'deliveryLocation']),
                'order_id' => $order->order_id,
                'delivery_zone' => $deliveryZone
            ], 'Order placed successfully!', 201);
        }
        catch (\Exception $e) {
            Log::error('Checkout error: ' . $e->getMessage());
            return $this->error($e->getMessage(), 422);
        }
    }
}
