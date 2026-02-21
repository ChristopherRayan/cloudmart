<?php

namespace Tests\Feature;

use App\Models\Delivery;
use App\Models\DeliveryLocation;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeliveryCodeConfirmationTest extends TestCase
{
    use RefreshDatabase;

    public function test_successful_delivery_confirmation_with_valid_code(): void
    {
        Queue::fake();

        $deliveryStaff = $this->createUser('delivery_staff');
        $context = $this->createTransitOrder('2468', $deliveryStaff->id);

        Sanctum::actingAs($deliveryStaff);

        $response = $this->postJson('/api/delivery/verify', [
            'order_id' => $context['order']->order_id,
            'delivery_code' => '2468',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order.delivery_status', 'delivered');

        $context['order']->refresh();
        $context['delivery']->refresh();

        $this->assertSame('delivered', $context['order']->status);
        $this->assertSame('delivered', $context['order']->delivery_status);
        $this->assertSame($deliveryStaff->id, $context['order']->delivered_by);
        $this->assertNotNull($context['order']->delivered_at);
        $this->assertSame('delivered', $context['delivery']->status);
        $this->assertNotNull($context['delivery']->delivered_at);
    }

    public function test_incorrect_delivery_code_returns_422(): void
    {
        Queue::fake();

        $deliveryStaff = $this->createUser('delivery_staff');
        $context = $this->createTransitOrder('1234', $deliveryStaff->id);

        Sanctum::actingAs($deliveryStaff);

        $response = $this->postJson('/api/delivery/verify', [
            'order_id' => $context['order']->order_id,
            'delivery_code' => '9999',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Invalid delivery code.');

        $context['order']->refresh();
        $this->assertSame('out_for_delivery', $context['order']->delivery_status);
        $this->assertNull($context['order']->delivered_at);
        $this->assertNull($context['order']->delivered_by);
    }

    public function test_unauthorized_user_cannot_confirm_delivery(): void
    {
        Queue::fake();

        $deliveryStaff = $this->createUser('delivery_staff');
        $customer = $this->createUser('customer');
        $context = $this->createTransitOrder('4826', $deliveryStaff->id);

        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/delivery/verify', [
            'order_id' => $context['order']->order_id,
            'delivery_code' => '4826',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'You do not have permission to access this resource.');
    }

    public function test_cannot_confirm_already_delivered_order(): void
    {
        Queue::fake();

        $deliveryStaff = $this->createUser('delivery_staff');
        $context = $this->createTransitOrder('3581', $deliveryStaff->id);

        $context['order']->update([
            'status' => 'delivered',
            'delivery_status' => 'delivered',
            'delivered_at' => now(),
            'delivered_by' => $deliveryStaff->id,
        ]);

        Sanctum::actingAs($deliveryStaff);

        $response = $this->postJson('/api/delivery/verify', [
            'order_id' => $context['order']->order_id,
            'delivery_code' => '3581',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This order has already been delivered.');
    }

    private function createTransitOrder(string $deliveryCode, int $deliveryPersonId): array
    {
        $customer = $this->createUser('customer');
        $location = DeliveryLocation::create([
            'name' => 'Test Campus Gate',
            'code' => 'TCG-' . random_int(100, 999),
            'description' => 'Testing point',
            'polygon_coords' => [
                ['lat' => -11.39, 'lng' => 34.02],
                ['lat' => -11.38, 'lng' => 34.03],
                ['lat' => -11.37, 'lng' => 34.01],
            ],
            'latitude' => -11.39000000,
            'longitude' => 34.02000000,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_id' => 'CM-TEST-' . random_int(100000, 999999),
            'user_id' => $customer->id,
            'delivery_location_id' => $location->id,
            'delivery_code' => $deliveryCode,
            'delivery_status' => 'out_for_delivery',
            'total_amount' => 25000,
            'status' => 'out_for_delivery',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone,
            'customer_address' => 'Test Address',
        ]);

        $delivery = Delivery::create([
            'order_id' => $order->id,
            'delivery_person_id' => $deliveryPersonId,
            'collector_phone' => $customer->phone,
            'status' => 'in_transit',
            'assigned_at' => now()->subHour(),
            'picked_up_at' => now()->subMinutes(40),
        ]);

        return [
            'order' => $order,
            'delivery' => $delivery,
        ];
    }

    private function createUser(string $role): User
    {
        return User::create([
            'name' => ucfirst(str_replace('_', ' ', $role)) . ' ' . random_int(100, 999),
            'email' => strtolower($role) . random_int(1000, 9999) . '@example.com',
            'phone' => '099' . random_int(1000000, 9999999),
            'password' => 'password123',
            'role' => $role,
            'is_active' => true,
        ]);
    }
}
