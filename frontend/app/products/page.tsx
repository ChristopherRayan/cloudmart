'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shared/ProductCard';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { apiGet } from '@/lib/api';
import { Product, ApiResponse, PaginatedResponse } from '@/types';
import { useProducts } from '@/contexts/ProductContext';

function ProductList() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const { categories, isLoadingCategories } = useProducts();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [meta, setMeta] = useState<{
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    } | null>(null);
    const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at');
    const [sortDir, setSortDir] = useState(searchParams.get('sort_dir') || 'desc');
    const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
    const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    // Filter states
    const categoryId = searchParams.get('category_id');
    const searchQuery = searchParams.get('search') || '';
    const [searchTerm, setSearchTerm] = useState(searchQuery);

    useEffect(() => {
        let isMounted = true;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (categoryId) params.append('category_id', categoryId);
                if (searchQuery) params.append('search', searchQuery);
                params.append('sort_by', sortBy);
                params.append('sort_dir', sortDir);
                params.append('per_page', '20');
                params.append('page', currentPage.toString());

                const response = await apiGet<ApiResponse<PaginatedResponse<Product>>>(`/products?${params.toString()}`, {
                    cacheTtlMs: 15000,
                });
                const paginated = response.data.data;

                if (!isMounted) {
                    return;
                }

                if (paginated && paginated.data) {
                    setProducts(paginated.data);
                    setMeta({
                        current_page: paginated.current_page,
                        last_page: paginated.last_page,
                        total: paginated.total,
                        per_page: paginated.per_page,
                    });
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                if (isMounted) {
                    setProducts([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setIsInitialLoad(false);
                }
            }
        };

        void fetchProducts();

        return () => {
            isMounted = false;
        };
    }, [categoryId, searchQuery, sortBy, sortDir, currentPage]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) {
            params.set('search', searchTerm);
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.push(`/products?${params.toString()}`);
    };

    const handleCategoryChange = (id: number | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (id) {
            params.set('category_id', id.toString());
        } else {
            params.delete('category_id');
        }
        params.set('page', '1');
        router.push(`/products?${params.toString()}`);
    };

    const handleSortChange = (value: string) => {
        const [field, dir] = value.split(':');
        setSortBy(field);
        setSortDir(dir);

        const params = new URLSearchParams(searchParams.toString());
        params.set('sort_by', field);
        params.set('sort_dir', dir);
        params.set('page', '1');
        router.push(`/products?${params.toString()}`);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || (meta && page > meta.last_page)) {
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`/products?${params.toString()}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-dark-100">Our Products</h1>
                    <div className="text-sm text-dark-400">
                        {isLoadingCategories ? 'Loading filters...' : `${categories.length} categories available`}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-64 shrink-0">
                        <div className="sticky top-24 space-y-6">
                            {/* Search */}
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input-field pl-10"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-3.5 h-5 w-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </form>

                            {/* Categories */}
                            <div className="card p-4">
                                <h3 className="font-semibold text-dark-100 mb-4">Categories</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleCategoryChange(null)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!categoryId ? 'bg-primary-600 text-white' : 'text-dark-300 hover:bg-dark-800'
                                            }`}
                                    >
                                        All Categories
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategoryChange(cat.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${Number(categoryId) === cat.id
                                                ? 'bg-primary-600 text-white'
                                                : 'text-dark-300 hover:bg-dark-800'
                                                }`}
                                        >
                                            {cat.name}
                                            {cat.products_count !== undefined && (
                                                <span className="float-right opacity-60 text-xs mt-0.5">({cat.products_count})</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div className="card p-4">
                                <h3 className="font-semibold text-dark-100 mb-4">Sort By</h3>
                                <select
                                    value={`${sortBy}:${sortDir}`}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="bg-dark-800 border border-dark-700 text-dark-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2"
                                >
                                    <option value="created_at:desc">Newest First</option>
                                    <option value="price:asc">Price: Low to High</option>
                                    <option value="price:desc">Price: High to Low</option>
                                    <option value="name:asc">Name: A-Z</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Product Grid Area */}
                    <div className="flex-1">
                        <div className="mb-6 flex items-center justify-end">
                            <span className="text-dark-400 text-sm">
                                {(loading || isLoadingCategories)
                                    ? 'Loading...'
                                    : `Showing ${products.length} of ${meta?.total ?? products.length} items`}
                            </span>
                        </div>

                        {isInitialLoad && loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <LoadingSkeleton key={i} />
                                ))}
                            </div>
                        ) : (
                            <>
                                {products.length === 0 ? (
                                    <div className="text-center py-20 card">
                                        <p className="text-4xl mb-4">🔍</p>
                                        <h3 className="text-lg font-medium text-dark-200">No products found</h3>
                                        <p className="text-dark-400 mt-2">Try adjusting your filters or search query.</p>
                                        <button
                                            onClick={() => {
                                                handleCategoryChange(null);
                                                setSearchTerm('');
                                                router.push('/products');
                                            }}
                                            className="mt-4 btn-secondary text-sm py-2"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>
                                        {products.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                )}

                                {meta && meta.last_page > 1 && (
                                    <div className="mt-8 flex items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handlePageChange(meta.current_page - 1)}
                                            disabled={meta.current_page <= 1 || loading}
                                            className="px-4 py-2 rounded-lg border border-dark-700 bg-dark-900 text-dark-200 hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-dark-300">
                                            Page {meta.current_page} of {meta.last_page}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handlePageChange(meta.current_page + 1)}
                                            disabled={meta.current_page >= meta.last_page || loading}
                                            className="px-4 py-2 rounded-lg border border-dark-700 bg-dark-900 text-dark-200 hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-dark-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <ProductList />
        </Suspense>
    );
}
