'use client';

import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const { isAuthenticated } = useAuth();
    const [adding, setAdding] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please sign in to add items to cart');
            return;
        }
        setAdding(true);
        try {
            await addItem(product.id, 1);
            toast.success(`${product.name} added to cart!`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add item');
        } finally {
            setAdding(false);
        }
    };

    return (
        <Link href={`/products/${product.id}`}>
            <div className="card-hover group cursor-pointer h-full flex flex-col">
                {/* Product Image */}
                <div className="relative h-48 rounded-xl mb-4 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23374151"/%3E%3Ctext x="200" y="200" font-family="Arial" font-size="40" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle"%3E🛒%3C/text%3E%3C/svg%3E';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-dark-800 to-dark-700 flex items-center justify-center">
                            <span className="text-4xl">🛒</span>
                        </div>
                    )}

                    {!product.is_active && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                            <span className="badge bg-red-500/20 text-red-400">Unavailable</span>
                        </div>
                    )}

                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {product.discount_price && product.discount_price < product.price && (
                            <span className="badge bg-red-500 text-white font-bold shadow-lg">
                                {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                            </span>
                        )}
                        {product.is_featured && (
                            <span className="badge bg-primary-500 text-white font-bold shadow-lg text-[10px] uppercase">
                                Featured
                            </span>
                        )}
                    </div>

                    {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                        <div className="absolute top-2 right-2 z-10">
                            <span className="badge bg-yellow-500/20 text-yellow-400 text-[10px]">Low Stock</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col">
                    <p className="text-xs text-primary-400 font-medium mb-1">{product.category?.name}</p>
                    <h3 className="text-dark-100 font-semibold mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-dark-400 text-sm line-clamp-2 mb-4 flex-1">{product.description}</p>

                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                            {product.discount_price && product.discount_price < product.price ? (
                                <>
                                    <span className="text-lg font-bold text-red-400">
                                        MWK {Number(product.discount_price).toLocaleString()}
                                    </span>
                                    <span className="text-xs text-dark-400 line-through">
                                        MWK {Number(product.price).toLocaleString()}
                                    </span>
                                </>
                            ) : (
                                <span className="text-lg font-bold text-primary-400">
                                    MWK {Number(product.price).toLocaleString()}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={adding || product.stock_quantity === 0}
                            className="btn-primary text-sm py-2 px-4"
                        >
                            {adding ? '...' : product.stock_quantity === 0 ? 'Out of Stock' : 'Add'}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
