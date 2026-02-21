<?php

namespace App\Http\Middleware;

use App\Services\DeliveryZoneService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateGeofence
{
    public function __construct(private DeliveryZoneService $deliveryZoneService)
    {
    }

    /**
     * Validate that checkout coordinates are inside an active delivery zone.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');
        $allowDevBypass = app()->environment('local') && $request->filled('delivery_location_id');

        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            if ($allowDevBypass) {
                return $next($request);
            }

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Valid latitude and longitude are required for checkout.',
            ], 422);
        }

        if ($request->filled('accuracy') && (float) $request->input('accuracy') > 100) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'GPS accuracy is too low. Please ensure accuracy is within 100 meters.',
            ], 422);
        }

        $zone = $this->deliveryZoneService->findValidDeliveryZone((float) $latitude, (float) $longitude);

        if (!$zone) {
            if ($allowDevBypass) {
                return $next($request);
            }

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Delivery is not available in your location.',
            ], 422);
        }

        // Keep zone details available for downstream code if needed.
        $request->attributes->set('geofence_zone', $zone);

        return $next($request);
    }
}
