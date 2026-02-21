'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { apiGet } from '@/lib/api';
import { Order, ApiResponse, PaginatedResponse } from '@/types';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet<ApiResponse<PaginatedResponse<Order>>>('/orders')
            .then(res => setOrders(res.data.data.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return 'badge-pending';
            case 'processing': return 'badge-processing';
            case 'assigned': return 'badge-processing';
            case 'out_for_delivery': return 'badge-processing animate-pulse';
            case 'delivered': return 'badge-delivered';
            case 'cancelled': return 'badge-cancelled';
            default: return 'badge bg-dark-700 text-dark-300';
        }
    };

    const formatStatusLabel = (status: string) => {
        if (status === 'processing') return 'assigned';
        return status.replace(/_/g, ' ');
    };

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Header />

            <main className="flex-grow mx-auto px-4 w-full py-12">
                <h1 className="text-3xl font-bold text-dark-100 mb-8">My Orders</h1>

                {loading ? (
                    <LoadingSkeleton count={3} />
                ) : orders.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-4xl mb-4">📦</p>
                        <h2 className="text-xl font-medium text-dark-200">No orders found</h2>
                        <Link href="/products" className="btn-primary mt-6 inline-block">Start Shopping</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Link key={order.order_id} href={`/orders/${order.order_id}`} className="block">
                                <div className="card hover:border-primary-500/30 transition-all group">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-lg text-dark-100 group-hover:text-primary-400 transition-colors">
                                                    #{order.order_id}
                                                </h3>
                                                <span className={getStatusBadge(order.status)}>
                                                    {formatStatusLabel(order.status)}
                                                </span>
                                            </div>
                                            <p className="text-dark-400 text-sm">
                                                Ordered on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-8 text-sm">
                                            <div>
                                                <p className="text-dark-400">Total</p>
                                                <p className="font-semibold text-dark-100">MWK {Number(order.total_amount).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-dark-400">Items</p>
                                                <p className="font-semibold text-dark-100">{order.order_items?.length || 0}</p>
                                            </div>
                                            <div className="text-primary-500">
                                                View Details →
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
