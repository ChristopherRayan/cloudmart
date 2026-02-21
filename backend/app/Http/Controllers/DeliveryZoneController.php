<?php

namespace App\Http\Controllers;

use App\Models\DeliveryZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DeliveryZoneController extends Controller
{
    /**
     * GET /api/admin/delivery-zones (admin only)
     */
    public function index(): JsonResponse
    {
        try {
            $zones = DeliveryZone::orderBy('zone_name')
                ->paginate(request()->get('per_page', 10));

            return $this->success($zones);
        } catch (\Exception $e) {
            Log::error('Error fetching delivery zones: ' . $e->getMessage());
            return $this->error('Failed to fetch delivery zones', 500);
        }
    }

    /**
     * POST /api/admin/delivery-zones (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'zone_name' => 'required|string|max:150',
            'latitude_center' => 'required|numeric|min:-90|max:90',
            'longitude_center' => 'required|numeric|min:-180|max:180',
            'radius_meters' => 'required|integer|min:100',
            'delivery_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        try {
            $zone = DeliveryZone::create($request->all());

            return $this->success($zone, 'Delivery zone created successfully.', 201);
        } catch (\Exception $e) {
            Log::error('Error creating delivery zone: ' . $e->getMessage());
            return $this->error('Failed to create delivery zone', 500);
        }
    }

    /**
     * PUT /api/admin/delivery-zones/{id} (admin only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $zone = DeliveryZone::find($id);

        if (!$zone) {
            return $this->error('Delivery zone not found.', 404);
        }

        $request->validate([
            'zone_name' => 'sometimes|string|max:150',
            'latitude_center' => 'sometimes|numeric|min:-90|max:90',
            'longitude_center' => 'sometimes|numeric|min:-180|max:180',
            'radius_meters' => 'sometimes|integer|min:100',
            'delivery_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        try {
            $zone->update($request->all());

            return $this->success($zone, 'Delivery zone updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating delivery zone: ' . $e->getMessage());
            return $this->error('Failed to update delivery zone', 500);
        }
    }

    /**
     * DELETE /api/admin/delivery-zones/{id} (admin only)
     */
    public function destroy(int $id): JsonResponse
    {
        $zone = DeliveryZone::find($id);

        if (!$zone) {
            return $this->error('Delivery zone not found.', 404);
        }

        try {
            $zone->delete();

            return $this->success(null, 'Delivery zone deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting delivery zone: ' . $e->getMessage());
            return $this->error('Failed to delete delivery zone', 500);
        }
    }

    /**
     * PATCH /api/admin/delivery-zones/{id}/toggle-status (admin only)
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $zone = DeliveryZone::find($id);

        if (!$zone) {
            return $this->error('Delivery zone not found.', 404);
        }

        try {
            $zone->update(['is_active' => !$zone->is_active]);

            return $this->success([
                'id' => $zone->id,
                'is_active' => $zone->is_active
            ], 'Delivery zone status updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error toggling delivery zone status: ' . $e->getMessage());
            return $this->error('Failed to toggle delivery zone status', 500);
        }
    }
}
