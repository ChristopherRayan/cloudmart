<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class CartService
{
    /**
     * Get or create the user's active cart.
     */
    public function getOrCreateCart(int $userId): Cart
    {
        $cart = Cart::where('user_id', $userId)
            ->where('status', 'active')
            ->with('items.product')
            ->first();

        if (!$cart) {
            $cart = Cart::create([
                'user_id' => $userId,
                'status' => 'active',
            ]);
            $cart->load('items.product');
        }

        return $cart;
    }

    /**
     * Add an item to the cart (or update quantity if already exists).
     */
    public function addItem(int $userId, int $productId, int $quantity = 1): Cart
    {
        $product = Product::where('id', $productId)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            throw new \Exception('Product not found or is inactive.');
        }

        if (!$product->hasStock($quantity)) {
            throw new \Exception("Insufficient stock. Available: {$product->stock_quantity}");
        }

        $cart = $this->getOrCreateCart($userId);

        // Check if item already in cart
        $existingItem = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->first();

        if ($existingItem) {
            $newQuantity = $existingItem->quantity + $quantity;
            if (!$product->hasStock($newQuantity)) {
                throw new \Exception("Insufficient stock. Available: {$product->stock_quantity}");
            }
            $existingItem->update([
                'quantity' => $newQuantity,
                'price' => $product->price,
            ]);
        }
        else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $productId,
                'quantity' => $quantity,
                'price' => $product->price,
            ]);
        }

        return $cart->fresh(['items.product']);
    }

    /**
     * Update item quantity in cart.
     */
    public function updateItemQuantity(int $userId, int $itemId, int $quantity): Cart
    {
        $cart = $this->getOrCreateCart($userId);

        $item = CartItem::where('id', $itemId)
            ->where('cart_id', $cart->id)
            ->with('product')
            ->first();

        if (!$item) {
            throw new \Exception('Cart item not found.');
        }

        if ($quantity <= 0) {
            $item->delete();
        }
        else {
            if (!$item->product->hasStock($quantity)) {
                throw new \Exception("Insufficient stock. Available: {$item->product->stock_quantity}");
            }
            $item->update([
                'quantity' => $quantity,
                'price' => $item->product->price,
            ]);
        }

        return $cart->fresh(['items.product']);
    }

    /**
     * Remove item from cart.
     */
    public function removeItem(int $userId, int $itemId): Cart
    {
        $cart = $this->getOrCreateCart($userId);

        $item = CartItem::where('id', $itemId)
            ->where('cart_id', $cart->id)
            ->first();

        if (!$item) {
            throw new \Exception('Cart item not found.');
        }

        $item->delete();

        return $cart->fresh(['items.product']);
    }

    /**
     * Clear all items from the cart.
     */
    public function clearCart(int $userId): void
    {
        $cart = Cart::where('user_id', $userId)
            ->where('status', 'active')
            ->first();

        if ($cart) {
            $cart->items()->delete();
        }
    }
}
