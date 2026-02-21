<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\DeliveryLocationController;
use App\Http\Controllers\DeliveryZoneController;
use App\Http\Controllers\GeofenceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\SeedController;
use Illuminate\Support\Facades\Route;

/* |-------------------------------------------------------------------------- | Authentication Routes |-------------------------------------------------------------------------- */
Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class , 'register']);
    Route::post('/login', [AuthController::class , 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class , 'logout']);
    Route::get('/user', [AuthController::class , 'user']);

    // Profile Management
    Route::put('/profile', [App\Http\Controllers\ProfileController::class , 'update']);
    Route::post('/profile/image', [App\Http\Controllers\ProfileController::class , 'uploadImage']);

    // Reports
    Route::get('/reports', [App\Http\Controllers\ReportController::class , 'index']);
    Route::post('/reports', [App\Http\Controllers\ReportController::class , 'store']);
    Route::get('/reports/{report}', [App\Http\Controllers\ReportController::class , 'show']);
    Route::patch('/reports/{report}/status', [App\Http\Controllers\ReportController::class , 'updateStatus'])
        ->middleware('role:admin');

    // Notifications
    Route::get('/notifications', [AuthController::class , 'notifications']);
    Route::post('/notifications/{id}/read', [AuthController::class , 'markNotificationRead']);
    
    // Receipt/Invoice Generation
    Route::get('/orders/{orderId}/receipt', [ReceiptController::class, 'generateReceipt']);
    Route::get('/orders/{orderId}/download-receipt', [ReceiptController::class, 'downloadReceipt']);
});

/* |-------------------------------------------------------------------------- | Product & Category Routes |-------------------------------------------------------------------------- */
Route::get('/products', [ProductController::class , 'index']);
Route::get('/products/{id}', [ProductController::class , 'show']);
Route::get('/categories', [CategoryController::class , 'index']);
Route::get('/hero-images', [AdminController::class , 'heroImages']);

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/products', [ProductController::class , 'store']);
    Route::put('/products/{id}', [ProductController::class , 'update']);
    Route::delete('/products/{id}', [ProductController::class , 'destroy']);
    
    // Product Image Management
    Route::post('/products/{id}/image', [ProductImageController::class, 'upload']);
    Route::delete('/products/{id}/image', [ProductImageController::class, 'remove']);

    // Category Management
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    Route::post('/categories/{id}/image', [CategoryController::class, 'uploadImage']);
});

/* |-------------------------------------------------------------------------- | Cart Routes |-------------------------------------------------------------------------- */
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/cart', [CartController::class , 'index']);
    Route::post('/cart/items', [CartController::class , 'addItem']);
    Route::put('/cart/items/{id}', [CartController::class , 'updateItem']);
    Route::delete('/cart/items/{id}', [CartController::class , 'removeItem']);
    Route::delete('/cart', [CartController::class , 'clear']);
});

/* |-------------------------------------------------------------------------- | Checkout & Order Routes |-------------------------------------------------------------------------- */
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/checkout', [CheckoutController::class , 'process'])
        ->middleware('geofence');
    Route::get('/orders', [OrderController::class , 'index']);
    Route::get('/orders/{orderId}', [OrderController::class , 'show']);
    Route::patch('/orders/{orderId}/cancel', [OrderController::class , 'cancel']);
});

/* |-------------------------------------------------------------------------- | Delivery Routes (Delivery Staff Only) |-------------------------------------------------------------------------- */
Route::middleware(['auth:sanctum', 'role:delivery_staff'])->group(function () {
    Route::get('/delivery/assigned', [DeliveryController::class , 'assigned']);
    Route::patch('/delivery/{deliveryId}/start', [DeliveryController::class , 'startDelivery']);
    Route::post('/delivery/verify', [DeliveryController::class , 'verifyHandshake'])
        ->middleware('throttle:delivery-verify');
    Route::get('/delivery/history', [DeliveryController::class , 'history']);
});

/* |-------------------------------------------------------------------------- | Geofence & Delivery Zone Routes |-------------------------------------------------------------------------- */
Route::post('/geofence/validate', [GeofenceController::class , 'check']);
Route::get('/delivery-locations', [DeliveryLocationController::class , 'index']);
Route::get('/delivery-zones', [DeliveryZoneController::class , 'index']);

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/delivery-zones', [DeliveryZoneController::class , 'store']);
    Route::put('/delivery-zones/{id}', [DeliveryZoneController::class , 'update']);
});

/* |-------------------------------------------------------------------------- | Admin Routes |-------------------------------------------------------------------------- */
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/orders', [AdminController::class , 'orders']);
    Route::get('/users', [AdminController::class , 'users']);
    Route::post('/users', [AdminController::class , 'storeUser']);
    Route::patch('/orders/{id}/assign', [AdminController::class , 'assignDelivery']);
    Route::get('/analytics', [AdminController::class , 'analytics']);
    Route::get('/audit-logs', [AdminController::class , 'auditLogs']);
    Route::patch('/users/{id}/toggle-status', [AdminController::class , 'toggleUserStatus']);
    Route::get('/settings', [AdminController::class , 'getSettings']);
    Route::put('/settings', [AdminController::class , 'updateSettings']);
    Route::post('/settings/hero-images', [AdminController::class , 'uploadHeroImages']);
    
    // Delivery Zones
    Route::apiResource('delivery-zones', DeliveryZoneController::class);
    Route::patch('/delivery-zones/{id}/toggle-status', [DeliveryZoneController::class, 'toggleStatus']);
});

// Public maintenance status endpoint
Route::get('/maintenance-status', [AdminController::class , 'maintenanceStatus']);

// Seeding endpoints (development only)
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/seed/products', [SeedController::class, 'seedProducts']);
});
