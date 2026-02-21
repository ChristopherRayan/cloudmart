<?php

namespace App\Http\Controllers;

use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private
        CartService $cartService
        )
    {
    }

    /**
     * GET /api/cart
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->cartService->getOrCreateCart($request->user()->id);

        return $this->success([
            'cart' => $cart,
            'total_items' => $cart->total_items,
            'total_amount' => $cart->total_amount,
        ]);
    }

    /**
     * POST /api/cart/items
     */
    public function addItem(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        try {
            $cart = $this->cartService->addItem(
                $request->user()->id,
                $request->product_id,
                $request->quantity
            );

            return $this->success([
                'cart' => $cart,
                'total_items' => $cart->total_items,
                'total_amount' => $cart->total_amount,
            ], 'Item added to cart.', 201);
        }
        catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * PUT /api/cart/items/{id}
     */
    public function updateItem(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:0',
        ]);

        try {
            $cart = $this->cartService->updateItemQuantity(
                $request->user()->id,
                $id,
                $request->quantity
            );

            return $this->success([
                'cart' => $cart,
                'total_items' => $cart->total_items,
                'total_amount' => $cart->total_amount,
            ], 'Cart updated.');
        }
        catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * DELETE /api/cart/items/{id}
     */
    public function removeItem(Request $request, int $id): JsonResponse
    {
        try {
            $cart = $this->cartService->removeItem(
                $request->user()->id,
                $id
            );

            return $this->success([
                'cart' => $cart,
                'total_items' => $cart->total_items,
                'total_amount' => $cart->total_amount,
            ], 'Item removed from cart.');
        }
        catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * DELETE /api/cart
     */
    public function clear(Request $request): JsonResponse
    {
        $this->cartService->clearCart($request->user()->id);

        return response()->json(null, 204);
    }
}
