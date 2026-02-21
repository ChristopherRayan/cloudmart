<?php

namespace App\Http\Controllers;

use App\Models\DeliveryLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class DeliveryLocationController extends Controller
{
    /**
     * GET /api/delivery-locations
     */
    public function index(): JsonResponse
    {
        try {
            $locations = DeliveryLocation::active()
                ->orderBy('name')
                ->get();

            return $this->success($locations);
        } catch (\Exception $e) {
            Log::error('Error fetching delivery locations: ' . $e->getMessage());
            return $this->error('Failed to fetch delivery locations', 500);
        }
    }
}
