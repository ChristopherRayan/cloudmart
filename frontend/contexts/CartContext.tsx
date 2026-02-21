'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api, { apiGet } from '@/lib/api';
import { Cart, CartItem, CartResponse, ApiResponse } from '@/types';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CartContextType {
    cart: Cart | null;
    addItem: (productId: number, quantity: number) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    totalItems: number;
    totalAmount: number;
    isLoading: boolean;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, hasRole } = useAuth();
    const isCustomer = hasRole('customer');

    // Initialize from localStorage if available
    const [cart, setCart] = useState<Cart | null>(null);

    const [totalItems, setTotalItems] = useState(0);

    const [totalAmount, setTotalAmount] = useState(0);

    const [isLoading, setIsLoading] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedCart = localStorage.getItem('cart_cache');
                if (savedCart) setCart(JSON.parse(savedCart));

                const savedItems = localStorage.getItem('cart_total_items');
                if (savedItems) setTotalItems(parseInt(savedItems, 10) || 0);

                const savedAmount = localStorage.getItem('cart_total_amount');
                if (savedAmount) setTotalAmount(parseFloat(savedAmount) || 0);
            } catch (e) {
                console.error('Failed to parse cart from localStorage', e);
            }
        }
    }, []);

    // Persist to localStorage whenever state changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (cart) localStorage.setItem('cart_cache', JSON.stringify(cart));
            localStorage.setItem('cart_total_items', totalItems.toString());
            localStorage.setItem('cart_total_amount', totalAmount.toString());
        }
    }, [cart, totalItems, totalAmount]);

    const refreshCart = useCallback(async () => {
        if (!isAuthenticated || !isCustomer) {
            setCart(null);
            setTotalItems(0);
            setTotalAmount(0);
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiGet<ApiResponse<CartResponse>>('/cart');
            const data = response.data.data;
            setCart(data.cart);
            setTotalItems(data.total_items);
            setTotalAmount(data.total_amount);
        } catch {
            // Cart might not exist yet
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, isCustomer]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addItem = useCallback(async (productId: number, quantity: number) => {
        if (hasRole('admin')) {
            toast.error('Admins cannot make purchases. Please use a customer account.');
            return;
        }

        const response = await api.post<ApiResponse<CartResponse>>('/cart/items', {
            product_id: productId,
            quantity,
        });
        const data = response.data.data;
        setCart(data.cart);
        setTotalItems(data.total_items);
        setTotalAmount(data.total_amount);
    }, [hasRole]);

    const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
        const response = await api.put<ApiResponse<CartResponse>>(`/cart/items/${itemId}`, { quantity });
        const data = response.data.data;
        setCart(data.cart);
        setTotalItems(data.total_items);
        setTotalAmount(data.total_amount);
    }, []);

    const removeItem = useCallback(async (itemId: number) => {
        const response = await api.delete<ApiResponse<CartResponse>>(`/cart/items/${itemId}`);
        const data = response.data.data;
        setCart(data.cart);
        setTotalItems(data.total_items);
        setTotalAmount(data.total_amount);
    }, []);

    const clearCart = useCallback(async () => {
        await api.delete('/cart');
        setCart(null);
        setTotalItems(0);
        setTotalAmount(0);
    }, []);

    return (
        <CartContext.Provider
            value={{
                cart,
                addItem,
                updateQuantity,
                removeItem,
                clearCart,
                totalItems,
                totalAmount,
                isLoading,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
