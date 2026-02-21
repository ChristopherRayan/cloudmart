'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import toast from 'react-hot-toast';

interface HandshakeModalProps {
    orderId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function HandshakeModal({ orderId, isOpen, onClose, onSuccess }: HandshakeModalProps) {
    const [deliveryCode, setDeliveryCode] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post<ApiResponse>('/delivery/verify', {
                order_id: orderId,
                delivery_code: deliveryCode,
            });

            if (response.data.success) {
                toast.success('Delivery code verified. Order marked as delivered.');
                onSuccess();
                onClose();
                setDeliveryCode('');
            }
        } catch (error: any) {
            console.error('Delivery code verification failed', error);
            const message = error.response?.data?.message || 'Verification failed. Please check the order ID and 4-digit code.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/50">
            <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="w-full max-w-md bg-gradient-to-br from-dark-900 to-dark-800 border border-dark-700 rounded-2xl p-6 relative z-10 animate-scale-in shadow-2xl shadow-dark-950/50">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-dark-800">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center border border-primary-500/20">
                                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            Confirm Delivery
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-dark-500">Order ID:</span>
                            <span className="text-sm font-mono font-medium text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded border border-primary-500/20">
                                #{orderId}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-dark-800 rounded-full text-dark-400 transition-colors border border-dark-700">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-gradient-to-br from-primary-500/5 to-accent-500/5 border border-primary-500/10 p-5 rounded-xl">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center flex-shrink-0 border border-primary-500/20">
                                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-dark-100 mb-2">Final Verification Required</h3>
                                <p className="text-sm text-dark-300 leading-relaxed">
                                    Ask the customer for their <span className="text-primary-400 font-semibold">4-digit delivery code</span> and enter it below to confirm successful delivery.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="label flex items-center gap-2">
                            <span className="text-dark-300 font-medium">4-Digit Delivery Code</span>
                            <span className="text-xs text-dark-500">(Provided by customer)</span>
                        </label>
                        <input
                            type="text"
                            value={deliveryCode}
                            onChange={(e) => setDeliveryCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="input-field text-lg font-medium"
                            placeholder="1234"
                            required
                            autoFocus
                            maxLength={4}
                            inputMode="numeric"
                        />
                        <p className="text-sm text-dark-400 mt-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Code must match exactly for delivery completion.
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || deliveryCode.length !== 4}
                            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-lg font-bold rounded-xl flex justify-center items-center transition-all duration-300 shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                                    Verifying...
                                </>
                            ) : (
                                'Confirm Delivery & Complete Order'
                            )}
                        </button>
                        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-dark-500">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Secure Verification Process</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
