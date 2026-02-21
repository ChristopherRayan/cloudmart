'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { Delivery, ApiResponse } from '@/types';
import DeliveryHistoryCard from '@/components/delivery/DeliveryHistoryCard';
import DeliveryLayout from '@/components/layout/DeliveryLayout';
import toast from 'react-hot-toast';

export default function DeliveryHistoryPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { isAuthenticated, hasRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || !hasRole('delivery_staff')) {
            router.push('/login');
            return;
        }
        fetchDeliveryHistory();
    }, [isAuthenticated, hasRole, router]);

    const fetchDeliveryHistory = async () => {
        try {
            setLoading(true);
            const response = await apiGet<ApiResponse<any>>(`/delivery/history?page=${page}`);
            const newDeliveries = response.data.data.data;
            if (page === 1) {
                setDeliveries(newDeliveries);
            } else {
                setDeliveries((prev) => [...prev, ...newDeliveries]);
            }
            setHasMore(page < response.data.data.last_page);
        } catch (error) {
            console.error('Failed to fetch delivery history', error);
            toast.error('Failed to load delivery history');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!hasMore || loading) return;
        setPage((prev) => prev + 1);
    };

    useEffect(() => {
        if (page > 1) fetchDeliveryHistory();
    }, [page]);

    if (loading && page === 1) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <DeliveryLayout>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
                            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full inline-block" />
                            Delivery Records
                            <span className="text-sm font-normal bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                                {deliveries.length} {deliveries.length === 1 ? 'Delivery' : 'Deliveries'}
                            </span>
                        </h1>
                        <p className="text-dark-400 mt-1">Your completed delivery records</p>
                    </div>
                    <button
                        onClick={() => { setPage(1); fetchDeliveryHistory(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg border border-dark-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {deliveries.length === 0 ? (
                    <div className="card text-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-indigo-500/20">
                            <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-dark-200 mb-2">No Delivery History</h3>
                        <p className="text-dark-400 max-w-md mx-auto">
                            You haven&apos;t completed any deliveries yet. Your records will appear here after completing orders.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deliveries.map((delivery) => (
                            <DeliveryHistoryCard key={delivery.id} delivery={delivery} />
                        ))}
                        {hasMore && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DeliveryLayout>
    );
}