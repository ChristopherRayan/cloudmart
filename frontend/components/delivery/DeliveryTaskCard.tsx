'use client';

import { useState } from 'react';
import { Delivery } from '@/types';
import HandshakeModal from './HandshakeModal';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface DeliveryTaskCardProps {
    delivery: Delivery;
    onRefresh: () => void;
}

export default function DeliveryTaskCard({ delivery, onRefresh }: DeliveryTaskCardProps) {
    const [isHandshakeOpen, setIsHandshakeOpen] = useState(false);
    const [starting, setStarting] = useState(false);
    const { order } = delivery;

    if (!order) return null;

    const googleMapsUrl = order.delivery_location?.latitude
        ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_location.latitude},${order.delivery_location.longitude}`
        : null;

    const isAssigned = delivery.status === 'assigned';
    const statusLabel = isAssigned
        ? 'Assigned to You'
        : delivery.status === 'in_transit'
            ? 'Out for Delivery'
            : delivery.status;
    const customerName = order.user?.name || order.customer_name || 'Guest Customer';
    const customerPhone = order.user?.phone || order.customer_phone;

    const handleStartDelivery = async () => {
        if (!isAssigned || starting) return;

        setStarting(true);
        try {
            await api.patch(`/delivery/${delivery.id}/start`);
            toast.success('Delivery started. Order is now out for delivery.');
            onRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to start delivery');
        } finally {
            setStarting(false);
        }
    };

    return (
        <div className="card overflow-hidden border border-dark-700 bg-gradient-to-br from-dark-900 to-dark-800 animate-slide-up shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
                {/* Header with Status & Order ID */}
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-primary-500/10 to-accent-500/10 text-primary-400 border border-primary-500/20">
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></span>
                            {statusLabel}
                        </span>
                        <span className="text-dark-500 text-sm font-mono font-medium">#{order.order_id}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-dark-500">Assigned</p>
                        <p className="text-sm text-dark-300">
                            {new Date(delivery.assigned_at || order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-5">
                    {/* Destination Info */}
                    <div className="flex items-start gap-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center flex-shrink-0 border border-primary-500/20">
                            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-dark-500 uppercase tracking-widest font-bold mb-1">Delivery Location</p>
                            <h3 className="text-base font-bold text-dark-100">{order.delivery_location?.name || 'Standard Zone'}</h3>
                                    <p className="text-sm text-dark-300 mt-1">
                                        {order.delivery_location?.address || order.delivery_location?.description || 'Address not available'}
                                    </p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-start gap-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-500/10 to-primary-500/10 flex items-center justify-center flex-shrink-0 border border-accent-500/20">
                            <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-dark-500 uppercase tracking-widest font-bold mb-1">Customer Details</p>
                            <p className="text-base font-medium text-dark-200">{customerName}</p>
                            <a 
                                href={customerPhone ? `tel:${customerPhone}` : '#'}
                                className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 mt-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {customerPhone || 'Phone not available'}
                            </a>
                        </div>
                    </div>

                    {/* Delivery Summary */}
                    <div className="p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                        <p className="text-xs text-dark-500 uppercase tracking-widest font-bold mb-3">Delivery Summary</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-dark-700 bg-dark-900/50 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wider text-dark-500">Items</p>
                                <p className="text-lg font-semibold text-dark-100">{order.order_items_count ?? order.order_items?.length ?? 0}</p>
                            </div>
                            <div className="rounded-lg border border-dark-700 bg-dark-900/50 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wider text-dark-500">Amount</p>
                                <p className="text-lg font-semibold text-primary-400">MWK {Number(order.total_amount).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    {googleMapsUrl ? (
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/20"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Navigate
                        </a>
                    ) : (
                        <button
                            disabled
                            className="flex items-center justify-center gap-2.5 py-3.5 px-4 bg-dark-800 text-dark-500 rounded-xl font-semibold cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Navigate
                        </button>
                    )}

                    {isAssigned ? (
                        <button
                            onClick={handleStartDelivery}
                            disabled={starting}
                            className="flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {starting ? 'Starting...' : 'Start Delivery'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsHandshakeOpen(true)}
                            className="flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-accent-500/20"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirm Delivery
                        </button>
                    )}
                </div>
            </div>

            {/* Handshake Verification Modal */}
            <HandshakeModal
                orderId={order.order_id}
                isOpen={isHandshakeOpen}
                onClose={() => setIsHandshakeOpen(false)}
                onSuccess={onRefresh}
            />
        </div>
    );
}
