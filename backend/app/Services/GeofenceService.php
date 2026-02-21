<?php

namespace App\Services;

use App\Models\DeliveryLocation;

class GeofenceService
{
    /**
     * Validate if coordinates are within approved delivery zones.
     *
     * @param float $latitude
     * @param float $longitude
     * @return array{isValid: bool, zoneName: string|null, nearestZone: string|null}
     */
    public function validateLocation(float $latitude, float $longitude): array
    {
        $locations = DeliveryLocation::active()->get();

        foreach ($locations as $location) {
            $polygon = $location->polygon_coords;
            $point = ['lat' => $latitude, 'lng' => $longitude];

            if ($this->isPointInPolygon($point, $polygon)) {
                return [
                    'isValid' => true,
                    'zoneName' => $location->name,
                    'zoneId' => $location->id,
                    'nearestZone' => null,
                ];
            }
        }

        // Outside all zones — find nearest
        $nearestZone = $this->findNearestZone($latitude, $longitude, $locations);

        return [
            'isValid' => false,
            'zoneName' => null,
            'zoneId' => null,
            'nearestZone' => $nearestZone,
        ];
    }

    /**
     * Ray-casting algorithm for point-in-polygon test (Jordan Curve Theorem).
     * Time Complexity: O(n) where n = polygon vertices.
     *
     * @param array{lat: float, lng: float} $point
     * @param array<array{lat: float, lng: float}> $polygon
     * @return bool
     */
    private function isPointInPolygon(array $point, array $polygon): bool
    {
        $n = count($polygon);
        if ($n < 3) {
            return false;
        }

        $inside = false;
        $px = $point['lng'];
        $py = $point['lat'];

        for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
            $xi = $polygon[$i]['lng'];
            $yi = $polygon[$i]['lat'];
            $xj = $polygon[$j]['lng'];
            $yj = $polygon[$j]['lat'];

            $intersect = (($yi > $py) !== ($yj > $py))
                && ($px < ($xj - $xi) * ($py - $yi) / ($yj - $yi) + $xi);

            if ($intersect) {
                $inside = !$inside;
            }
        }

        return $inside;
    }

    /**
     * Find the nearest delivery zone by calculating distance to each zone's centroid.
     */
    private function findNearestZone(float $latitude, float $longitude, $locations): ?string
    {
        $nearest = null;
        $minDistance = PHP_FLOAT_MAX;

        foreach ($locations as $location) {
            $centroidLat = $location->latitude ?? $this->calculateCentroidLat($location->polygon_coords);
            $centroidLng = $location->longitude ?? $this->calculateCentroidLng($location->polygon_coords);

            $distance = $this->haversineDistance($latitude, $longitude, $centroidLat, $centroidLng);

            if ($distance < $minDistance) {
                $minDistance = $distance;
                $nearest = $location->name;
            }
        }

        return $nearest;
    }

    /**
     * Haversine formula to calculate distance between two coordinates in meters.
     */
    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    private function calculateCentroidLat(array $polygon): float
    {
        return collect($polygon)->avg('lat');
    }

    private function calculateCentroidLng(array $polygon): float
    {
        return collect($polygon)->avg('lng');
    }
}
