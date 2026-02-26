'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { Delivery, ApiResponse } from '@/types';
import DeliveryTaskCard from '@/components/delivery/DeliveryTaskCard';
import DeliveryLayout from '@/components/layout/DeliveryLayout';
import toast from 'react-hot-toast';

export default function DeliveryDashboard() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, hasRole, isLoading } = useAuth();
    const router = useRouter();

    const fetchAssignedDeliveries = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            const response = await apiGet<ApiResponse<Delivery[]>>('/delivery/assigned', {
                cacheTtlMs: forceRefresh ? 0 : 5000,
                forceRefresh,
            });
            setDeliveries(response.data.data);
        } catch (error) {
            console.error('Failed to fetch deliveries', error);
            toast.error('Failed to load assigned deliveries');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated || !hasRole('delivery_staff')) {
            router.push('/login');
            return;
        }

        fetchAssignedDeliveries();
    }, [fetchAssignedDeliveries, hasRole, isAuthenticated, isLoading, router]);

    if (loading) {
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
                            <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse inline-block" />
                            Active Deliveries
                            <span className="text-sm font-normal bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                                {deliveries.length} {deliveries.length === 1 ? 'Order' : 'Orders'}
                            </span>
                        </h1>
                        <p className="text-dark-400 mt-1">Track and manage your assigned deliveries</p>
                    </div>
                    <button
                        onClick={() => fetchAssignedDeliveries(true)}
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
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-blue-500/20">
                            <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-dark-200 mb-2">No Active Deliveries</h3>
                        <p className="text-dark-400 max-w-md mx-auto mb-6">
                            You don&apos;t have any active deliveries. New orders will appear here when assigned.
                        </p>
                        <button
                            onClick={() => fetchAssignedDeliveries(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors mx-auto"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Check for Updates
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deliveries.map((delivery) => (
                            <DeliveryTaskCard
                                key={delivery.id}
                                delivery={delivery}
                                onRefresh={fetchAssignedDeliveries}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DeliveryLayout>
    );
}
