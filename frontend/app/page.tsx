'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, HelpCircle, DollarSign, ArrowRight, Star, TrendingUp, ShieldCheck, Clock, Users } from 'lucide-react';
import { apiGet } from '@/lib/api';
import ProductCard from '@/components/shared/ProductCard';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { Product, ApiResponse } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useProducts } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
    const { categories } = useProducts();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [latestProducts, setLatestProducts] = useState<Product[]>([]);
    const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [heroImages, setHeroImages] = useState<string[]>([]);
    const [bestDeals, setBestDeals] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const [currentDealsIndex, setCurrentDealsIndex] = useState(0);

    const fallbackHeroImages = featuredProducts
        .map((product) => product.image_url)
        .filter((url): url is string => Boolean(url && url.trim()));
    const activeHeroImages = heroImages.length >= 3 ? heroImages : fallbackHeroImages;

    useEffect(() => {
        if (activeHeroImages.length === 0) return;
        const interval = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % activeHeroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [activeHeroImages.length]);

    useEffect(() => {
        if (currentBgIndex >= activeHeroImages.length && activeHeroImages.length > 0) {
            setCurrentBgIndex(0);
        }
    }, [activeHeroImages.length, currentBgIndex]);

    useEffect(() => {
        if (bestDeals.length <= 2) return;
        const interval = setInterval(() => {
            setCurrentDealsIndex((prev) => (prev + 2) % bestDeals.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [bestDeals]);

    useEffect(() => {
        if (authLoading || !isAuthenticated) return;
        if (user?.role === 'delivery_staff') {
            router.replace('/delivery/dashboard');
        }
    }, [authLoading, isAuthenticated, router, user]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, heroRes] = await Promise.all([
                    apiGet<ApiResponse<{ data: Product[] }>>('/products?per_page=20', {
                        cacheTtlMs: 30000,
                    }),
                    apiGet<ApiResponse<string[]>>('/hero-images', {
                        cacheTtlMs: 30000,
                    }).catch(() => null),
                ]);

                const allProducts = productsRes.data.data.data;

                const latest = [...allProducts]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 8);

                const bestSellers = [...allProducts]
                    .sort((a, b) => {
                        const scoreA =
                            (a.is_featured ? 2 : 0) +
                            (a.discount_price && a.discount_price < a.price ? 1 : 0) +
                            (a.stock_quantity > 0 ? 1 : 0);
                        const scoreB =
                            (b.is_featured ? 2 : 0) +
                            (b.discount_price && b.discount_price < b.price ? 1 : 0) +
                            (b.stock_quantity > 0 ? 1 : 0);
                        return scoreB - scoreA;
                    })
                    .slice(0, 8);

                const featured = allProducts.filter((p) => p.is_featured).slice(0, 8);
                const deals = allProducts
                    .filter((p) => p.discount_price && Number(p.discount_price) < Number(p.price))
                    .slice(0, 8);

                setLatestProducts(latest);
                setBestSellerProducts(bestSellers);
                setFeaturedProducts(featured);
                setBestDeals(deals);

                const configuredHeroImages = Array.isArray(heroRes?.data?.data)
                    ? heroRes.data.data.filter((url): url is string => typeof url === 'string' && url.trim() !== '')
                    : [];
                setHeroImages(configuredHeroImages);
            } catch (error) {
                console.error('Failed to fetch home data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const rotatingDeals = bestDeals.length <= 2
        ? bestDeals
        : [bestDeals[currentDealsIndex], bestDeals[(currentDealsIndex + 1) % bestDeals.length]];

    const renderProductSection = (
        title: string,
        subtitle: string,
        icon: ReactNode,
        products: Product[]
    ) => (
        <section className="py-16">
            <div className="w-full px-4 sm:px-8 lg:px-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 text-primary-400 mb-3">
                            {icon}
                            <span className="text-xs uppercase tracking-[0.2em] font-semibold">Home Collection</span>
                        </div>
                        <h2 className="text-3xl font-bold text-dark-100">{title}</h2>
                        <p className="text-dark-400 mt-2">{subtitle}</p>
                    </div>
                    <Link href="/products" className="text-primary-400 hover:text-primary-300 font-semibold text-sm flex items-center gap-1 group">
                        View All Products <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </Link>
                </div>

                {loading ? (
                    <LoadingSkeleton count={4} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.length > 0 ? (
                            products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-dark-400 bg-dark-900/50 rounded-xl border border-dark-800">
                                <div className="text-4xl mb-4">🔍</div>
                                <p>No products found for {title.toLowerCase()}.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Header />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative min-h-[52vh] flex items-center justify-center overflow-hidden">
                    {/* Background Image Slider */}
                    <div className="absolute inset-0 z-0">
                        {activeHeroImages.length > 0 ? (
                            activeHeroImages.map((imageUrl, index) => (
                                <div
                                    key={`${imageUrl}-${index}`}
                                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentBgIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
                                >
                                    <img
                                        src={imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&q=80';
                                        }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-950" />
                        )}
                        {/* Premium Multi-layer Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-dark-950/30 z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/60 via-transparent to-dark-950/60 z-10" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,dark-950_100%)] z-10" />
                    </div>

                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 z-5 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-soft" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
                    </div>

                    <div className="relative z-20 w-full px-4 sm:px-8 lg:px-12">
                        <div className="flex flex-col items-center justify-center min-h-[calc(52vh-80px)] text-center py-6">
                            {/* Premium Badge */}
                            <div className="inline-flex items-center gap-2 mb-8 animate-fade-in">
                                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                <span className="text-white/90 text-xs font-medium tracking-wider uppercase">
                                    Mzuzu University Campus Delivery
                                </span>
                            </div>

                            {/* Main Heading */}
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                <span className="text-white">
                                    <span className="block">Campus Delivery</span>
                                    <span className="block gradient-text mt-2">Made Simple</span>
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-lg sm:text-xl text-dark-200 mb-10 max-w-2xl mx-auto animate-slide-up font-light leading-relaxed" style={{ animationDelay: '0.2s' }}>
                                Get groceries, stationery, and food delivered right to your dorm or office. 
                                <span className="text-primary-400 font-medium">Fast, reliable, and geofenced for you.</span>
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                <Link 
                                    href="/products" 
                                    className="group relative w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Shop Now
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Link>
                                {!authLoading && !isAuthenticated && (
                                    <Link 
                                        href="/register" 
                                        className="group w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 hover:border-white/40"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            Create Account
                                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">+</span>
                                        </span>
                                    </Link>
                                )}
                            </div>

                            {/* Trust Indicators */}
                            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                                <div className="flex items-center gap-2 text-dark-400">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-dark-900" />
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 border-2 border-dark-900" />
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-dark-900 border-2 border-dark-900" />
                                    </div>
                                    <span className="text-sm">500+ Students</span>
                                </div>
                                <div className="flex items-center gap-2 text-dark-400">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={16} className="text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                    <span className="text-sm">4.9 Rating</span>
                                </div>
                                <div className="flex items-center gap-2 text-dark-400">
                                    <Truck size={18} className="text-primary-400" />
                                    <span className="text-sm">Free Delivery</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </section>

                {/* Features Section */}
                <section className="py-12 bg-dark-950 relative -mt-[10vh] z-30">
                    <div className="w-full px-4 sm:px-8 lg:px-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-14 h-14 rounded-full border border-primary-500/50 bg-transparent flex items-center justify-center text-primary-400 transition-all duration-300 group-hover:scale-110">
                                    <Users size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">500+ Users</h3>
                                    <p className="text-primary-400 text-xs font-medium">Growing campus community</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-14 h-14 rounded-full border border-primary-500/50 bg-transparent flex items-center justify-center text-primary-400 transition-all duration-300 group-hover:scale-110">
                                    <Truck size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Free Shipping</h3>
                                    <p className="text-primary-400 text-xs font-medium">Orders over MWK 20k</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-14 h-14 rounded-full border border-primary-500/50 bg-transparent flex items-center justify-center text-primary-400 transition-all duration-300 group-hover:scale-110">
                                    <HelpCircle size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">24/7 Support</h3>
                                    <p className="text-primary-400 text-xs font-medium">Around the clock help</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-14 h-14 rounded-full border border-primary-500/50 bg-transparent flex items-center justify-center text-primary-400 transition-all duration-300 group-hover:scale-110">
                                    <ShieldCheck size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Money Back</h3>
                                    <p className="text-primary-400 text-xs font-medium">Guaranteed refund</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Bento Grid */}
                <section className="py-16 bg-dark-950">
                    <div className="w-full px-4 sm:px-8 lg:px-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-dark-100">Shop by Category</h2>
                                <p className="text-dark-400 mt-2">Explore our wide range of products</p>
                            </div>
                            <Link href="/products" className="text-primary-400 hover:text-primary-300 font-semibold text-sm flex items-center gap-1 group">
                                View All Categories <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-20 md:grid-rows-2 gap-4 h-[480px]">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className={`skeleton rounded-2xl ${i === 1 ? 'md:col-span-6 md:row-span-2' : (i === 2 || i === 5 ? 'md:col-span-9' : 'md:col-span-5')}`} />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-20 md:grid-rows-2 gap-4 h-auto md:h-[480px]">
                                {categories.slice(0, 5).map((category, index) => {
                                    // New proportions for index-based Layout (20 columns total):
                                    // [Tall 6x2 (0)] [Landscape 9x1 (1)] [Square 5x1 (2)]
                                    // [Tall 6x2 (0)] [Square 5x1 (3)]    [Landscape 9x1 (4)]

                                    let gridClass = "";
                                    if (index === 0) gridClass = "md:col-span-6 md:row-span-2"; // Left Tall (30% - increased by 20% from 25%)
                                    if (index === 1) gridClass = "md:col-span-9"; // Middle Top Landscape (45% - reduced from 50%)
                                    if (index === 2) gridClass = "md:col-span-5"; // Right Top Square (25% - stays square)
                                    if (index === 3) gridClass = "md:col-span-5"; // Middle Bottom Square (25% - stays square)
                                    if (index === 4) gridClass = "md:col-span-9"; // Right Bottom Landscape (45% - reduced from 50%)

                                    return (
                                        <Link
                                            key={category.id}
                                            href={`/products?category_id=${category.id}`}
                                            className={`group relative overflow-hidden rounded-xl border border-dark-800 bg-dark-900 hover:border-primary-500/50 transition-all duration-300 ${gridClass}`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/95 via-dark-950/20 to-transparent z-10" />

                                            {category.image_url ? (
                                                <img
                                                    src={category.image_url}
                                                    alt={category.name}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-60 group-hover:opacity-100"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-dark-800 flex items-center justify-center text-7xl text-dark-700/30 select-none group-hover:scale-110 transition-transform duration-700 group-hover:text-primary-500/10">
                                                    {category.name.toLowerCase().includes('food') ? '🍔' :
                                                        category.name.toLowerCase().includes('drink') ? '🥤' :
                                                            category.name.toLowerCase().includes('tech') ? '💻' :
                                                                category.name.toLowerCase().includes('stationery') ? '✏️' : '📦'}
                                                </div>
                                            )}

                                            <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                                                <div className="text-center md:text-left flex flex-col items-center md:items-start">
                                                    {(index === 0 || index === 1) && (
                                                        <span className="text-dark-300 text-[10px] md:text-sm mb-1 uppercase tracking-widest font-medium">
                                                            {index === 0 ? "Sale Up To 30% Off" : "Special Offer"}
                                                        </span>
                                                    )}

                                                    <h3 className={`font-bold text-dark-100 group-hover:text-primary-400 transition-colors tracking-tight ${index === 0 ? 'text-2xl md:text-3xl' : 'text-xl'
                                                        }`}>
                                                        {category.name}
                                                    </h3>

                                                    {(index === 0 || index === 1 || index === 4) && (
                                                        <div className="mt-3 flex flex-col items-center md:items-start group/btn">
                                                            <span className="text-primary-400 text-[10px] font-bold uppercase tracking-widest border-b-2 border-primary-500/0 group-hover/btn:border-primary-500/100 transition-all duration-300 pb-0.5">
                                                                {index === 0 ? "View Offer" : (index === 1 ? "Shop Now" : "View More")}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Decorative overlay */}
                                            <div className="absolute inset-0 pointer-events-none bg-primary-500/0 group-hover:bg-primary-500/5 transition-colors duration-300" />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {renderProductSection(
                    'Latest Products',
                    'Fresh arrivals, updated continuously.',
                    <Clock size={16} />,
                    latestProducts
                )}

                {renderProductSection(
                    'Best Sellers',
                    'Most popular picks from our catalog.',
                    <TrendingUp size={16} />,
                    bestSellerProducts
                )}

                <section className="py-16 bg-gradient-to-b from-red-950/35 via-red-900/15 to-dark-950">
                    <div className="w-full px-4 sm:px-8 lg:px-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 text-red-300 mb-3">
                                    <DollarSign size={16} />
                                    <span className="text-xs uppercase tracking-[0.2em] font-semibold">Auto Rotates Every 5 Seconds</span>
                                </div>
                                <h2 className="text-3xl font-bold text-red-100">Best Deals</h2>
                                <p className="text-red-200/80 mt-2">Two deal cards per view with rotating picks.</p>
                            </div>
                            <Link href="/products?sort=price_asc" className="px-5 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-400 text-white transition-colors">
                                View All Deals
                            </Link>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {[1, 2].map((item) => (
                                    <div key={item} className="skeleton rounded-2xl h-[220px]" />
                                ))}
                            </div>
                        ) : rotatingDeals.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700" key={`${currentDealsIndex}-${rotatingDeals.map((deal) => deal.id).join('-')}`}>
                                {rotatingDeals.map((product) => {
                                    const salePrice = Number(product.discount_price ?? product.price);
                                    const originalPrice = Number(product.price);
                                    const discountPercent = Math.max(0, Math.round(((originalPrice - salePrice) / originalPrice) * 100));

                                    return (
                                        <Link
                                            key={product.id}
                                            href={`/products/${product.id}`}
                                            className="group relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/80 to-dark-900 hover:border-red-300/80 transition-all duration-300 hover:shadow-[0_0_35px_rgba(239,68,68,0.35)]"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-red-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative flex flex-col md:flex-row min-h-[220px]">
                                                <div className="md:w-2/5 bg-dark-900/60">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover md:min-h-[220px]" />
                                                    ) : (
                                                        <div className="w-full h-full min-h-[220px] flex items-center justify-center text-5xl">🏷️</div>
                                                    )}
                                                </div>
                                                <div className="md:w-3/5 p-6 flex flex-col justify-between">
                                                    <div>
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold mb-3">
                                                            {discountPercent}% OFF
                                                        </span>
                                                        <h3 className="text-xl font-bold text-red-50 mb-2 line-clamp-2">{product.name}</h3>
                                                        <p className="text-red-100/70 text-sm line-clamp-2">{product.description || 'Limited-time offer on this product.'}</p>
                                                    </div>
                                                    <div className="mt-5 flex items-end justify-between gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-2xl font-bold text-red-200">
                                                                MWK {salePrice.toLocaleString()}
                                                            </span>
                                                            <span className="text-red-200/60 line-through text-sm">
                                                                MWK {originalPrice.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-semibold uppercase tracking-wider text-red-300 group-hover:text-white transition-colors">
                                                            Shop Now &rarr;
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-red-500/30 bg-red-950/30 text-red-100 p-10 text-center">
                                No active deals yet. Check back soon.
                            </div>
                        )}
                    </div>
                </section>

                {renderProductSection(
                    'Featured Products',
                    'Handpicked products worth highlighting.',
                    <Star size={16} />,
                    featuredProducts
                )}
            </main>

            <Footer />
        </div>
    );
}
