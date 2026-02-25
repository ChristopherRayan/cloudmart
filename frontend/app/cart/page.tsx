'use client';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CheckoutModal from '@/components/checkout/CheckoutModal';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function CartPage() {
    const { cart, updateQuantity, removeItem, clearCart, totalAmount, isLoading } = useCart();
    const { isAuthenticated, hasRole } = useAuth();
    const isPurchaseRestricted = hasRole('admin') || hasRole('delivery_staff');
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-950">
                <Header />
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="text-center card max-w-md w-full animate-fade-in">
                        <h2 className="text-2xl font-bold text-dark-100 mb-4">Sign in to View Cart</h2>
                        <p className="text-dark-400 mb-6">You need to be logged in to manage your shopping cart.</p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/login" className="btn-primary w-full">Sign In</Link>
                            <Link href="/register" className="btn-secondary w-full">Register</Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (isPurchaseRestricted) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-950">
                <Header />
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="text-center card max-w-md w-full animate-fade-in">
                        <h2 className="text-2xl font-bold text-dark-100 mb-4">Cart Not Available</h2>
                        <p className="text-dark-400 mb-6">
                            Admin and delivery staff accounts cannot add items to cart or place orders.
                        </p>
                        <Link href="/products" className="btn-primary w-full">
                            Browse Products
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-950">
                <Header />
                <main className="flex-grow mx-auto px-4 w-full py-12">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-dark-800 rounded w-1/4"></div>
                        <div className="h-64 bg-dark-800 rounded"></div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Header />

            <main className="flex-grow mx-auto px-4 w-full py-12">
                <h1 className="text-3xl font-bold text-dark-100 mb-8">Shopping Cart</h1>

                {!cart || cart.items.length === 0 ? (
                    <div className="text-center py-20 card">
                        <p className="text-6xl mb-4">🛒</p>
                        <h2 className="text-xl font-semibold text-dark-200 mb-2">Your cart is empty</h2>
                        <p className="text-dark-400 mb-8">Looks like you havent added anything yet.</p>
                        <Link href="/products" className="btn-primary">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.items.map((item) => (
                                <div key={item.id} className="card flex flex-col sm:flex-row gap-4 items-center">
                                    <div className="w-24 h-24 bg-dark-800 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-2xl">📦</span>
                                    </div>

                                    <div className="flex-grow text-center sm:text-left">
                                        <Link href={`/products/${item.product_id}`} className="font-semibold text-dark-100 hover:text-primary-400 transition-colors">
                                            {item.product.name}
                                        </Link>
                                        <p className="text-sm text-dark-400 mt-1">MWK {Number(item.price).toLocaleString()}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                if (item.quantity > 1) {
                                                    updateQuantity(item.id, item.quantity - 1);
                                                } else {
                                                    if (window.confirm(`Are you sure you want to remove ${item.product.name} from your cart?`)) {
                                                        removeItem(item.id);
                                                    }
                                                }
                                            }}
                                            className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-700 flex items-center justify-center text-dark-300 transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-medium text-dark-100">{item.quantity}</span>
                                        <button
                                            onClick={() => {
                                                if (item.quantity < item.product.stock_quantity) {
                                                    updateQuantity(item.id, item.quantity + 1);
                                                } else {
                                                    toast.error(`Only ${item.product.stock_quantity} units available in stock.`);
                                                }
                                            }}
                                            disabled={item.quantity >= item.product.stock_quantity}
                                            className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-700 flex items-center justify-center text-dark-300 transition-colors disabled:opacity-30"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="text-right min-w-[100px]">
                                        <p className="font-bold text-dark-100">
                                            MWK {Number(item.price * item.quantity).toLocaleString()}
                                        </p>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Remove ${item.product.name} from your cart?`)) {
                                                    removeItem(item.id);
                                                }
                                            }}
                                            className="text-xs text-red-400 hover:text-red-300 mt-2 underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to clear your entire cart?')) {
                                            clearCart();
                                        }
                                    }}
                                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                                >
                                    Clear Cart
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-1">
                            <div className="card sticky top-24">
                                <h3 className="text-lg font-bold text-dark-100 mb-4">Order Summary</h3>

                                <div className="space-y-3 mb-6 border-b border-dark-700 pb-6">
                                    <div className="flex justify-between text-dark-300">
                                        <span>Subtotal</span>
                                        <span>MWK {Number(totalAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-dark-300">
                                        <span>Delivery Fee</span>
                                        <span>It's Free!</span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-xl font-bold text-dark-100 mb-6">
                                    <span>Total</span>
                                    <span className="gradient-text">MWK {Number(totalAmount).toLocaleString()}</span>
                                </div>

                                {totalAmount < 2000 && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                                        <p className="text-yellow-400 text-sm text-center">
                                            Minimum order is MWK 2,000. <br /> Add MWK {Number(2000 - totalAmount).toLocaleString()} more.
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setIsCheckoutModalOpen(true)}
                                    disabled={totalAmount < 2000}
                                    className={`btn-primary w-full py-3 ${totalAmount < 2000 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <CheckoutModal
                isOpen={isCheckoutModalOpen}
                onClose={() => setIsCheckoutModalOpen(false)}
            />

            <Footer />
        </div>
    );
}
