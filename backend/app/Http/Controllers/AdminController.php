<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Notifications\DeliveryAssignedNotification;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    private OrderService $orderService;
    
    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * GET /api/admin/orders
     */
    public function orders(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'deliveryLocation', 'delivery.deliveryPerson', 'orderItems.product']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $query->where('order_id', 'like', '%' . $request->search . '%');
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(15);

        return $this->success($orders);
    }

    /**
     * GET /api/admin/users
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::select('id', 'name', 'email', 'phone', 'role', 'is_active', 'created_at');

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(15);

        return $this->success($users);
    }

    /**
     * PATCH /api/admin/users/{id}/toggle-status
     */
    public function toggleUserStatus(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->error('User not found.', 404);
        }

        // Prevent admin from deactivating themselves
        if ($user->id === auth()->id()) {
            return $this->error('You cannot deactivate your own account.', 422);
        }

        $previousStatus = $user->is_active;
        $user->update(['is_active' => !$user->is_active]);

        $status = $user->is_active ? 'activated' : 'deactivated';
        
        // Log the action
        $this->logAudit('update', 'user', (string)$user->id, "User account {$status}");

        return $this->success($user, "User account {$status} successfully.");
    }

    /**
     * PATCH /api/admin/orders/{id}/assign
     */
    public function assignDelivery(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'delivery_person_id' => 'required|exists:users,id',
        ]);

        $order = Order::find($id);

        if (!$order) {
            return $this->error('Order not found.', 404);
        }

        if (in_array($order->status, ['cancelled', 'delivered'])) {
            return $this->error('This order can no longer be assigned.', 422);
        }

        $deliveryPerson = User::find($request->delivery_person_id);
        if (!$deliveryPerson || !$deliveryPerson->isDeliveryStaff()) {
            return $this->error('Selected user is not delivery staff.', 422);
        }

        if (!$deliveryPerson->is_active) {
            return $this->error('Selected delivery staff account is inactive.', 422);
        }

        $delivery = Delivery::updateOrCreate(
        ['order_id' => $order->id],
        [
            'delivery_person_id' => $request->delivery_person_id,
            'collector_phone' => $order->user->phone,
            'status' => 'assigned',
            'assigned_at' => now(),
            'picked_up_at' => null,
            'delivered_at' => null,
        ]
        );

        // Assignment moves order into assigned stage; delivery staff moves it to out_for_delivery.
        $order->update([
            'status' => 'processing',
            'delivery_status' => 'pending',
            'delivered_at' => null,
            'delivered_by' => null,
        ]);

        // Notify customer about status change
        $this->orderService->notifyStatusUpdate($order->fresh(['user']));

        // Notify delivery staff about new assignment.
        try {
            $deliveryPerson->notify(new DeliveryAssignedNotification($order->fresh(['deliveryLocation', 'deliveryZone'])));
        } catch (\Throwable $e) {
            Log::warning('Failed to notify delivery staff about assignment.', [
                'order_id' => $order->order_id,
                'delivery_person_id' => $deliveryPerson->id,
                'error' => $e->getMessage(),
            ]);
        }
        
        // Log the action
        $this->logAudit('update', 'order', (string)$order->id, "Order assigned to delivery person ID: {$request->delivery_person_id}");

        return $this->success([
            'order' => $order->fresh(['delivery.deliveryPerson']),
            'delivery' => $delivery,
        ], 'Delivery person assigned.');
    }

    /**
     * GET /api/admin/analytics
     */
    public function analytics(Request $request): JsonResponse
    {
        try {
            $cacheKey = 'admin.analytics.v1';
            $analytics = Cache::remember($cacheKey, 60, function () {
                $today = Carbon::today();
                $thisMonth = Carbon::now()->startOfMonth();

                return [
                    'total_orders' => Order::count(),
                    'orders_today' => Order::whereDate('created_at', $today)->count(),
                    'orders_this_month' => Order::where('created_at', '>=', $thisMonth)->count(),
                    'revenue_today' => Order::whereDate('created_at', $today)
                        ->where('payment_status', 'completed')
                        ->sum('total_amount'),
                    'revenue_this_month' => Order::where('created_at', '>=', $thisMonth)
                        ->where('payment_status', 'completed')
                        ->sum('total_amount'),
                    'total_revenue' => Order::where('payment_status', 'completed')->sum('total_amount'),
                    'total_users' => User::where('role', 'customer')->count(),
                    'total_products' => Product::count(),
                    'low_stock_products' => Product::where('stock_quantity', '<', 10)->where('is_active', true)->count(),
                    'orders_by_status' => Order::select('status', DB::raw('count(*) as count'))
                        ->groupBy('status')
                        ->pluck('count', 'status'),
                    'recent_orders' => Order::with(['user', 'deliveryLocation'])
                        ->orderBy('created_at', 'desc')
                        ->limit(5)
                        ->get(),
                ];
            });

            return $this->success($analytics);
        } catch (\Exception $e) {
            Log::error('Analytics error: ' . $e->getMessage());
            return $this->error('Failed to load analytics data', 500);
        }
    }

    /**
     * GET /api/admin/settings
     */
    public function getSettings(): JsonResponse
    {
        try {
            $settings = DB::table('settings')->pluck('value', 'key')->toArray();
            $defaults = [
                'maintenance_mode' => 'false',
                'maintenance_message' => 'We are currently performing scheduled maintenance. Please check back soon.',
                'hero_images' => [],
            ];

            $merged = array_merge($defaults, $settings);
            $merged['hero_images'] = $this->parseHeroImages(is_string($merged['hero_images']) ? $merged['hero_images'] : null);

            return $this->success($merged);
        } catch (\Exception $e) {
            // Handle case where settings table doesn't exist
            Log::error('Settings table error: ' . $e->getMessage());
            return $this->success([
                'maintenance_mode' => 'false',
                'maintenance_message' => 'We are currently performing scheduled maintenance. Please check back soon.',
                'hero_images' => [],
            ]);
        }
    }

    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,customer,delivery_staff',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'],
            'address' => $validated['address'] ?? null,
            'is_active' => true,
        ]);
        
        // Log the action
        $this->logAudit('create', 'user', (string)$user->id, "User created with role: {$validated['role']}");

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    /**
     * PUT /api/admin/settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'maintenance_mode' => 'sometimes|string',
                'maintenance_message' => 'sometimes|string|max:500',
            ]);
    
            foreach ($request->only(['maintenance_mode', 'maintenance_message']) as $key => $value) {
                DB::table('settings')->updateOrInsert(
                    ['key' => $key],
                    ['value' => $value, 'updated_at' => now()]
                );
            }
    
            $settings = DB::table('settings')->pluck('value', 'key');
                    
            // Log the action
            $this->logAudit('update', 'settings', 'global', 'System settings updated');
            
            return $this->success($settings, 'Settings updated.');
        } catch (\Exception $e) {
            Log::error('Settings update error: ' . $e->getMessage());
            return $this->error('Failed to update settings', 500);
        }
    }

    /**
     * POST /api/admin/settings/hero-images
     */
    public function uploadHeroImages(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'images' => 'required|array|min:3',
                'images.*' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
            ]);

            $existingRaw = DB::table('settings')->where('key', 'hero_images')->value('value');
            $existingImages = $this->parseHeroImages($existingRaw);
            foreach ($existingImages as $imageUrl) {
                $this->deleteStoredImage($imageUrl);
            }

            $storedUrls = [];
            foreach ($request->file('images', []) as $image) {
                $path = $image->store('hero_images', 'public');
                $storedUrls[] = asset('storage/' . $path);
            }

            DB::table('settings')->updateOrInsert(
                ['key' => 'hero_images'],
                ['value' => json_encode($storedUrls), 'updated_at' => now(), 'created_at' => now()]
            );

            $this->logAudit('update', 'settings', 'global', 'Hero background images updated');

            return $this->success(['hero_images' => $storedUrls], 'Hero images updated.');
        } catch (\Exception $e) {
            Log::error('Hero image upload error: ' . $e->getMessage());
            return $this->error('Failed to upload hero images', 500);
        }
    }

    /**
     * GET /api/hero-images (public)
     */
    public function heroImages(): JsonResponse
    {
        try {
            $raw = DB::table('settings')->where('key', 'hero_images')->value('value');
            return $this->success($this->parseHeroImages($raw));
        } catch (\Exception $e) {
            Log::error('Hero images fetch error: ' . $e->getMessage());
            return $this->success([]);
        }
    }

    /**
     * GET /api/maintenance-status (public)
     */
    public function maintenanceStatus(): JsonResponse
    {
        $mode = DB::table('settings')->where('key', 'maintenance_mode')->value('value');
        $message = DB::table('settings')->where('key', 'maintenance_message')->value('value');

        return $this->success([
            'maintenance_mode' => $mode === 'true',
            'maintenance_message' => $message,
        ]);
    }

    /**
     * GET /api/admin/audit-logs
     */
    public function auditLogs(Request $request): JsonResponse
    {
        try {
            $filters = [];
            
            if ($request->has('action')) {
                $filters['action'] = $request->action;
            }
            
            if ($request->has('user')) {
                $filters['user'] = $request->user;
            }
            
            if ($request->has('date_from')) {
                $filters['date_from'] = $request->date_from;
            }
            
            if ($request->has('date_to')) {
                $filters['date_to'] = $request->date_to;
            }
            
            if ($request->has('per_page')) {
                $filters['per_page'] = $request->per_page;
            }
            
            $logs = AuditLog::orderBy('created_at', 'desc')
                ->when($request->filled('action'), function ($query) use ($request) {
                    $query->where('action', $request->action);
                })
                ->when($request->filled('user'), function ($query) use ($request) {
                    $query->where(function ($q) use ($request) {
                        $q->where('user_name', 'like', '%' . $request->user . '%')
                          ->orWhere('user_email', 'like', '%' . $request->user . '%');
                    });
                })
                ->when($request->filled('date_from'), function ($query) use ($request) {
                    $query->whereDate('created_at', '>=', $request->date_from);
                })
                ->when($request->filled('date_to'), function ($query) use ($request) {
                    $query->whereDate('created_at', '<=', $request->date_to);
                })
                ->paginate($request->get('per_page', 10));

            return $this->success($logs);
        } catch (\Exception $e) {
            Log::error('Audit logs error: ' . $e->getMessage());
            return $this->error('Failed to load audit logs', 500);
        }
    }
    
    private function logAudit(string $action, string $resourceType, string $resourceId, ?string $description = null): void
    {
        $user = auth()->user();
        
        \App\Models\AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'System',
            'user_email' => $user?->email ?? 'system@cloudimart.mw',
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'description' => $description,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    private function parseHeroImages(?string $raw): array
    {
        if (!$raw) {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        return array_values(array_filter($decoded, static fn ($url): bool => is_string($url) && trim($url) !== ''));
    }

    private function deleteStoredImage(string $imageUrl): void
    {
        $path = parse_url($imageUrl, PHP_URL_PATH) ?: $imageUrl;
        $storagePos = strpos($path, '/storage/');
        if ($storagePos === false) {
            return;
        }

        $relative = ltrim(substr($path, $storagePos + strlen('/storage/')), '/');
        if ($relative !== '' && Storage::disk('public')->exists($relative)) {
            Storage::disk('public')->delete($relative);
        }
    }
}
