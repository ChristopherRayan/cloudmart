'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { apiGet } from '@/lib/api';
import { Order, ApiResponse } from '@/types';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
    const { id } = useParams(); // Capture order_id (string) from URL
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    // We need to fetch by the order_id string (e.g. ORD-20240101-001) which is passed as 'id' param
    useEffect(() => {
        if (id) {
            apiGet<ApiResponse<Order>>(`/orders/${id}`)
                .then(res => setOrder(res.data.data))
                .catch(err => {
                    console.error(err);
                    toast.error('Failed to load order.');
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    const canCancel = order && ['pending', 'processing'].includes(order.status);

    const formatStatusLabel = (status: string) => {
        if (status === 'processing') return 'ASSIGNED';
        return status.toUpperCase().replace(/_/g, ' ');
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            await api.patch(`/orders/${order?.order_id}/cancel`);
            toast.success('Order cancelled successfully');
            // Refresh order data
            const res = await apiGet<ApiResponse<Order>>(`/orders/${id}`);
            setOrder(res.data.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-950">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!order) return <div className="text-center py-20">Order not found</div>;

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Header />

            <main className="flex-grow mx-auto px-4 w-full py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-dark-100 flex items-center gap-4">
                            Order #{order.order_id}
                        </h1>
                        <p className="text-dark-400 mt-2">
                            Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                order.status === 'out_for_delivery' ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' :
                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-400' :
                                    order.status === 'cancelled' ? 'bg-red-400' :
                                    order.status === 'out_for_delivery' ? 'bg-primary-400 animate-pulse' :
                                    'bg-blue-400'
                                    }`}></span>
                                {formatStatusLabel(order.status)}
                            </span>
                            <span className="text-xs text-dark-500">
                                {order.delivery?.delivery_person
                                    ? `• ${order.status === 'delivered' ? 'Delivered by' : 'Assigned to'} ${order.delivery.delivery_person.name}`
                                    : ''}
                            </span>
                        </div>
                        {order.delivery_code && (
                            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3">
                                <div className="text-xs uppercase tracking-widest text-primary-300">Delivery Code</div>
                                <div className="text-2xl font-black tracking-[0.35em] text-primary-300">{order.delivery_code}</div>
                                <div className="text-xs text-primary-200/80">Share with delivery staff only when order arrives.</div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={async () => {
                                // Download receipt
                                try {
                                    const token = localStorage.getItem('token');
                                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'}/orders/${order.order_id}/download-receipt`, {
                                        method: 'GET',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Accept': 'application/pdf',
                                        },
                                    });
                                    
                                    if (!response.ok) {
                                        throw new Error('Failed to download receipt');
                                    }
                                    
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `receipt-${order.order_id}-${new Date().toISOString().split('T')[0]}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                } catch (error) {
                                    console.error('Error downloading receipt:', error);
                                    toast.error('Failed to download receipt');
                                }
                            }}
                            className="btn-accent text-sm py-2 px-4 flex items-center gap-2"
                        >
                            <span>📄</span> Receipt
                        </button>
                        <button
                            onClick={() => {
                                // Refresh order data
                                apiGet<ApiResponse<Order>>(`/orders/${id}`)
                                    .then(res => setOrder(res.data.data))
                                    .catch(err => {
                                        console.error(err);
                                        toast.error('Failed to refresh order.');
                                    });
                            }}
                            className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        {canCancel && (
                            <button onClick={handleCancel} className="btn-danger text-sm py-2 px-4">
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left: Order Items */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="card">
                            <h2 className="font-semibold text-lg text-dark-100 mb-4 border-b border-dark-700 pb-2">Items</h2>
                            <div className="space-y-4">
                                {order.order_items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center sm:items-start">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 bg-dark-800 rounded-lg flex items-center justify-center text-2xl">
                                                📦
                                            </div>
                                            <div>
                                                <p className="font-medium text-dark-100">{item.product.name}</p>
                                                <p className="text-sm text-dark-400">Qty: {item.quantity} × MWK {Number(item.price).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-dark-200">
                                            MWK {Number(item.subtotal).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-dark-700 mt-6 pt-4 flex justify-between items-center">
                                <span className="font-medium text-dark-300">Total Amount</span>
                                <span className="text-xl font-bold text-primary-400">MWK {Number(order.total_amount).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="card">
                            <h2 className="font-semibold text-lg text-dark-100 mb-4 border-b border-dark-700 pb-2">Delivery Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-dark-400 text-sm mb-1">Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${order.status === 'delivered' ? 'bg-primary-500/20 text-primary-400' :
                                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {formatStatusLabel(order.status)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-dark-400 text-sm mb-1">Location</p>
                                    <p className="text-dark-100">{order.delivery_location?.name}</p>
                                </div>
                                {order.delivery?.delivery_person && (
                                    <div className="sm:col-span-2 bg-dark-800/50 p-4 rounded-xl mt-2">
                                        <p className="text-sm text-primary-400 font-medium mb-2">Delivery Agent Assigned</p>
                                        <p className="text-dark-200">{order.delivery.delivery_person.name}</p>
                                        <p className="text-dark-400 text-sm">{order.delivery.delivery_person.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Timeline/Status */}
                    <div className="md:col-span-1">
                        <div className="card">
                            <h2 className="font-semibold text-lg text-dark-100 mb-4">Order Tracking</h2>
                            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-700">
                                {['pending', 'processing', 'out_for_delivery', 'delivered'].map((step, idx) => {
                                    const isCompleted = getStepStatus(order.status, step);
                                    const isCurrent = order.status === step;

                                    // Get status labels with more descriptive text
                                    const statusLabels: Record<string, string> = {
                                        'pending': 'Order Received',
                                        'processing': 'Assigned to Delivery Staff',
                                        'out_for_delivery': 'Out for Delivery',
                                        'delivered': 'Order Delivered',
                                    };

                                    return (
                                        <div key={step} className="relative pl-8">
                                            <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${isCompleted || isCurrent ? 'bg-primary-500 border-primary-500' : 'bg-dark-800 border-dark-600'
                                                }`} />
                                            <h4 className={`font-medium ${isCompleted || isCurrent ? 'text-primary-400' : 'text-dark-400'}`}>
                                                {statusLabels[step]}
                                            </h4>
                                            {isCurrent && <p className="text-xs text-primary-300 mt-1">Current Status</p>}
                                            {isCompleted && <p className="text-xs text-dark-500 mt-1">Completed</p>}
                                        </div>
                                    );
                                })}
                                {order.status === 'cancelled' && (
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-red-500 border-2 border-red-500" />
                                        <h4 className="font-medium text-red-400">ORDER CANCELLED</h4>
                                        <p className="text-xs text-red-400 mt-1">Cancelled</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Delivery Info */}
                            {order.delivery && (
                                <div className="mt-6 pt-6 border-t border-dark-700">
                                    <h3 className="font-medium text-dark-200 mb-3">Delivery Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-dark-400">Agent:</span>
                                            <span className="text-dark-200">{order.delivery.delivery_person?.name || 'TBD'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-dark-400">Phone:</span>
                                            <span className="text-dark-200">{order.delivery.delivery_person?.phone || 'TBD'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-dark-400">Assigned:</span>
                                            <span className="text-dark-200">{order.delivery.assigned_at ? new Date(order.delivery.assigned_at).toLocaleDateString() : 'TBD'}</span>
                                        </div>
                                        {order.delivery.delivered_at && (
                                            <div className="flex justify-between">
                                                <span className="text-dark-400">Delivered:</span>
                                                <span className="text-dark-200">{new Date(order.delivery.delivered_at).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
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

function getStepStatus(currentStatus: string, step: string): boolean {
    const steps = ['pending', 'processing', 'out_for_delivery', 'delivered'];
    const currentIdx = steps.indexOf(currentStatus);
    const stepIdx = steps.indexOf(step);
    return currentIdx > stepIdx;
}
