// VERSION_FETCH_FIX_01
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { apiGet } from '@/lib/api';
import { Product, ApiResponse } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProductDetail() {
    const params = useParams();
    const id = params.id;
    const { addItem } = useCart();
    const { isAuthenticated, hasRole } = useAuth();
    const isPurchaseRestricted = hasRole('admin') || hasRole('delivery_staff');

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchProduct = async () => {
            try {
                const response = await apiGet<ApiResponse<Product>>(`/products/${id}`, { cacheTtlMs: 30000 });
                setProduct(response.data.data);
            } catch (error) {
                console.error('Error fetching product:', error);
                toast.error('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleAddToCart = async () => {
        if (isPurchaseRestricted) {
            toast.error('This account type cannot place orders.');
            return;
        }
        if (!isAuthenticated) {
            toast.error('Please sign in to add items to cart');
            return;
        }

        if (!product) return;

        setAdding(true);
        try {
            await addItem(product.id, qty);
            toast.success(`${product.name} added to cart!`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add item');
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-dark-100">
                <p className="text-2xl mb-4">Product not found</p>
                <NextLink href="/products" className="btn-secondary">Back to Products</NextLink>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Image Section */}
                    <div className="relative h-80 md:h-96 bg-dark-800 rounded-xl flex items-center justify-center overflow-hidden group">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-dark-400">
                                <span className="text-8xl mb-4">🛒</span>
                                <span>No Image Available</span>
                            </div>
                        )}

                        {!product.is_active && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                <span className="badge bg-red-500/20 text-red-400 text-lg px-6 py-2">Unavailable</span>
                            </div>
                        )}
                        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                            <div className="absolute top-4 right-4 z-10">
                                <span className="badge bg-yellow-500/20 text-yellow-400">Low Stock: {product.stock_quantity} left</span>
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="flex flex-col justify-center">
                        <div className="mb-6">
                            <NextLink href={`/products?category_id=${product.category_id}`} className="text-primary-400 hover:text-primary-300 text-sm font-medium mb-2 inline-block">
                                {product.category?.name}
                            </NextLink>
                            <h1 className="text-3xl md:text-4xl font-bold text-dark-100 mb-4">{product.name}</h1>
                            <div className="text-3xl font-bold gradient-text mb-6">
                                MWK {Number(product.price).toLocaleString()}
                            </div>
                            <div className="text-dark-300 leading-relaxed text-lg whitespace-pre-wrap">
                                {product.description}
                            </div>
                        </div>

                        <div className="mt-auto border-t border-dark-700 pt-6">
                            {!isPurchaseRestricted ? (
                                <>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex items-center bg-dark-800 rounded-xl border border-dark-600">
                                            <button
                                                onClick={() => setQty(Math.max(1, qty - 1))}
                                                className="w-10 h-10 flex items-center justify-center text-dark-300 hover:text-white transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-10 text-center font-medium text-dark-100">{qty}</span>
                                            <button
                                                onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}
                                                disabled={qty >= product.stock_quantity}
                                                className="w-10 h-10 flex items-center justify-center text-dark-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="text-sm text-dark-400">
                                            {product.stock_quantity > 0 ? (
                                                <span className="text-primary-400">In Stock</span>
                                            ) : (
                                                <span className="text-red-400">Out of Stock</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={adding || product.stock_quantity === 0 || !product.is_active}
                                            className="btn-primary flex-1 text-lg py-3"
                                        >
                                            {adding ? 'Adding...' : product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-xl border border-primary-500/25 bg-primary-500/10 px-4 py-3 text-sm text-primary-300">
                                    Ordering is only available for customer accounts.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
