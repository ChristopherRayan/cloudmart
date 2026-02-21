'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { Product, ApiResponse, PaginatedResponse } from '@/types';

export default function TestProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log('Fetching products...');
                const response = await apiGet<ApiResponse<PaginatedResponse<Product>>>('/products?per_page=5', { cacheTtlMs: 30000 });
                console.log('API Response:', response.data);
                
                if (response.data.success && response.data.data && response.data.data.data) {
                    console.log('Products received:', response.data.data.data.length);
                    setProducts(response.data.data.data);
                } else {
                    setError('Invalid response format');
                }
            } catch (err: any) {
                console.error('Error fetching products:', err);
                setError(err.message || 'Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-dark-300">Loading products...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-xl mb-4">Error: {error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="btn-primary"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950 p-8">
            <h1 className="text-3xl font-bold text-dark-100 mb-8">Test Products Page</h1>
            <p className="text-dark-300 mb-4">Found {products.length} products</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="card p-4">
                        <h2 className="font-bold text-dark-100 mb-2">{product.name}</h2>
                        <p className="text-dark-400 text-sm mb-2">{product.description}</p>
                        <p className="text-primary-400 font-bold">MWK {Number(product.price).toLocaleString()}</p>
                        {product.image_url && (
                            <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-full h-32 object-cover rounded mt-2"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}