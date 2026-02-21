<?php

namespace App\Services;

use App\Models\DeliveryZone;
use Illuminate\Support\Facades\Log;

class DeliveryZoneService
{
    /**
     * Check if a given location is within any active delivery zone
     * 
     * @param float $latitude User's latitude
     * @param float $longitude User's longitude
     * @return array|null Returns zone data if found, null if not found
     */
    public function findValidDeliveryZone(float $latitude, float $longitude): ?array
    {
        // Get all active delivery zones
        $zones = DeliveryZone::where('is_active', true)->get();

        foreach ($zones as $zone) {
            $distance = $this->calculateDistance(
                $latitude,
                $longitude,
                $zone->latitude_center,
                $zone->longitude_center
            );

            if ($distance <= $zone->radius_meters) {
                return [
                    'zone_id' => $zone->id,
                    'zone_name' => $zone->zone_name,
                    'delivery_fee' => $zone->delivery_fee,
                    'distance' => $distance
                ];
            }
        }

        return null;
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * 
     * @param float $lat1 Latitude of first point
     * @param float $lon1 Longitude of first point
     * @param float $lat2 Latitude of second point
     * @param float $lon2 Longitude of second point
     * @return float Distance in meters
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        // Earth's radius in meters
        $earthRadius = 6371000; // meters

        // Convert degrees to radians
        $lat1Rad = deg2rad($lat1);
        $lon1Rad = deg2rad($lon1);
        $lat2Rad = deg2rad($lat2);
        $lon2Rad = deg2rad($lon2);

        // Differences
        $latDiff = $lat2Rad - $lat1Rad;
        $lonDiff = $lon2Rad - $lon1Rad;

        // Haversine formula
        $a = sin($latDiff / 2) * sin($latDiff / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($lonDiff / 2) * sin($lonDiff / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c; // Distance in meters
    }
}