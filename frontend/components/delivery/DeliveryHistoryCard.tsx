'use client';

import { useState } from 'react';
import { Delivery } from '@/types';

interface DeliveryHistoryCardProps {
    delivery: Delivery;
}

export default function DeliveryHistoryCard({ delivery }: DeliveryHistoryCardProps) {
    const [showDetails, setShowDetails] = useState(false);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="bg-dark-800/50 rounded-xl border border-dark-700 overflow-hidden">
            <div 
                className="p-4 cursor-pointer"
                onClick={() => setShowDetails(!showDetails)}
            >
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-dark-100">
                                Order #{delivery.order?.order_id}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                Delivered
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center flex-shrink-0 border border-primary-500/20">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-dark-500 uppercase tracking-widest font-bold mb-1">Customer</p>
                                    <p className="text-sm font-medium text-dark-200">{delivery.order?.user?.name}</p>
                                    <p className="text-sm text-dark-400">📞 {delivery.order?.user?.phone}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center flex-shrink-0 border border-primary-500/20">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-dark-500 uppercase tracking-widest font-bold mb-1">Delivery Location</p>
                                    <p className="text-sm font-medium text-dark-200">{delivery.order?.delivery_location?.name}</p>
                                    <p className="text-sm text-dark-400">{delivery.order?.delivery_location?.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-right ml-4">
                        <p className="text-xs text-dark-500 uppercase tracking-widest font-bold mb-1">Completed</p>
                        <p className="text-sm font-medium text-dark-200">{formatDate(delivery.delivered_at)}</p>
                        <p className="text-xs text-dark-400 mt-2">
                            ₱{(delivery.order?.total_amount || 0).toFixed(2)}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                    <button 
                        className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDetails(!showDetails);
                        }}
                    >
                        {showDetails ? 'Hide Details' : 'Show Details'} 
                        <svg 
                            className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>
            
            {showDetails && (
                <div className="border-t border-dark-700 bg-dark-900/30 p-4">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-dark-500 uppercase tracking-widest font-bold mb-2">Delivery Details</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-dark-400"><span className="font-medium text-dark-200">Assigned:</span> {formatDate(delivery.assigned_at)}</p>
                                    <p className="text-dark-400"><span className="font-medium text-dark-200">Started:</span> {formatDate(delivery.created_at)}</p>
                                    <p className="text-dark-400"><span className="font-medium text-dark-200">Completed:</span> {formatDate(delivery.delivered_at)}</p>
                                </div>
                                <div>
                                    <p className="text-dark-400"><span className="font-medium text-dark-200">Collector Phone:</span> {delivery.collector_phone}</p>
                                    <p className="text-dark-400"><span className="font-medium text-dark-200">Status:</span> 
                                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                                            {delivery.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {delivery.order?.notes && (
                            <div>
                                <p className="text-xs text-dark-500 uppercase tracking-widest font-bold mb-2">Special Instructions</p>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm text-yellow-200">
                                    📝 {delivery.order.notes}
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <p className="text-xs text-dark-500 uppercase tracking-widest font-bold mb-2">Items Delivered</p>
                            <ul className="space-y-2">
                                {delivery.order?.order_items?.map(item => (
                                    <li key={item.id} className="flex justify-between text-sm">
                                        <span className="text-dark-300">{item.quantity}x {item.product.name}</span>
                                        <span className="text-dark-200">₱{item.price.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-dark-700 mt-2 pt-2 flex justify-between font-bold">
                                <span className="text-dark-200">Total Amount</span>
                                <span className="text-dark-100">₱{(delivery.order?.total_amount || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
