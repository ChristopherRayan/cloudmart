'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { apiGet } from '@/lib/api';
import { Delivery, ApiResponse, Order } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DeliveryDashboard() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [startingDeliveryId, setStartingDeliveryId] = useState<number | null>(null);
    const { user, hasRole } = useAuth();
    const router = useRouter();

    // Handshake Form State
    const [handshakeOrderId, setHandshakeOrderId] = useState('');
    const [deliveryCode, setDeliveryCode] = useState('');

    useEffect(() => {
        if (user && !hasRole('delivery_staff')) {
            router.push('/');
            return;
        }

        fetchDeliveries();
    }, [user]);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const res = await apiGet<ApiResponse<Delivery[]>>('/delivery/assigned');
            setDeliveries(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);

        try {
            await api.post('/delivery/verify', {
                order_id: handshakeOrderId,
                delivery_code: deliveryCode,
            });

            toast.success('Delivery verified successfully!');
            setHandshakeOrderId('');
            setDeliveryCode('');
            fetchDeliveries(); // Refresh list
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const handleStartDelivery = async (deliveryId: number) => {
        setStartingDeliveryId(deliveryId);
        try {
            await api.patch(`/delivery/${deliveryId}/start`);
            toast.success('Delivery started. Order is now out for delivery.');
            fetchDeliveries();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to start delivery');
        } finally {
            setStartingDeliveryId(null);
        }
    };

    if (!user || !hasRole('delivery_staff')) return null;

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Header />

            <main className="flex-grow w-full px-4 sm:px-8 lg:px-12 py-12">
                <h1 className="text-3xl font-bold text-dark-100 mb-8">Delivery Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Handshake Verification Form */}
                    <div className="md:col-span-1">
                        <div className="card sticky top-24">
                            <h2 className="text-xl font-bold text-dark-100 mb-4">Verify Delivery</h2>
                            <form onSubmit={handleVerify} className="space-y-4">
                                <div>
                                    <label className="label">Order ID</label>
                                    <input
                                        type="text"
                                        value={handshakeOrderId}
                                        onChange={(e) => setHandshakeOrderId(e.target.value.toUpperCase())}
                                        className="input-field"
                                        placeholder="ORD-..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">4-Digit Delivery Code</label>
                                    <input
                                        type="text"
                                        value={deliveryCode}
                                        onChange={(e) => setDeliveryCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="input-field"
                                        placeholder="1234"
                                        required
                                        maxLength={4}
                                        inputMode="numeric"
                                    />
                                    <p className="text-xs text-dark-400 mt-1">Ask the customer for the 4-digit delivery code.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={verifying || deliveryCode.length !== 4}
                                    className="btn-primary w-full"
                                >
                                    {verifying ? 'Verifying...' : 'Complete Delivery'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Assigned Tasks List */}
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-dark-100 flex items-center justify-between">
                            Your Tasks
                            <button onClick={fetchDeliveries} className="text-sm text-primary-400 hover:text-primary-300">Refresh</button>
                        </h2>

                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-dark-800 rounded-xl" />)}
                            </div>
                        ) : deliveries.length === 0 ? (
                            <div className="card text-center py-12">
                                <p className="text-4xl mb-4">🎉</p>
                                <p className="text-dark-300">No active deliveries assigned.</p>
                            </div>
                        ) : (
                            deliveries.map(delivery => (
                                <div key={delivery.id} className="card border-l-4 border-l-primary-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-dark-100">Order #{delivery.order?.order_id}</h3>
                                            <p className="text-dark-400 text-sm">
                                                Assigned: {delivery.assigned_at ? new Date(delivery.assigned_at).toLocaleTimeString() : '-'}
                                            </p>
                                        </div>
                                        <span className="badge badge-processing uppercase">{delivery.status}</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-dark-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">Customer</p>
                                            <p className="font-medium text-dark-200">{delivery.order?.user?.name}</p>
                                            <a href={`tel:${delivery.order?.user?.phone}`} className="text-primary-400 text-sm hover:underline">
                                                📞 {delivery.order?.user?.phone}
                                            </a>
                                        </div>
                                        <div className="bg-dark-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">Location</p>
                                            <p className="font-medium text-dark-200">{delivery.order?.delivery_location?.name}</p>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${delivery.order?.delivery_location?.latitude},${delivery.order?.delivery_location?.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-400 text-sm hover:underline"
                                            >
                                                🗺️ Open Maps
                                            </a>
                                        </div>
                                    </div>

                                    <div className="border-t border-dark-700 pt-3">
                                        <p className="text-sm font-medium text-dark-300 mb-2">Items:</p>
                                        <ul className="text-sm text-dark-400 list-disc list-inside">
                                            {delivery.order?.order_items?.map(item => (
                                                <li key={item.id}>{item.quantity}x {item.product.name}</li>
                                            ))}
                                        </ul>
                                        {delivery.order?.notes && (
                                            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-sm text-yellow-200">
                                                📝 Note: {delivery.order.notes}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        {delivery.status === 'assigned' ? (
                                            <button
                                                onClick={() => handleStartDelivery(delivery.id)}
                                                disabled={startingDeliveryId === delivery.id}
                                                className="btn-primary py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {startingDeliveryId === delivery.id ? 'Starting...' : 'Start Delivery'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setHandshakeOrderId(delivery.order?.order_id || '');
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="btn-secondary py-2"
                                            >
                                                Select for Verification
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                setHandshakeOrderId(delivery.order?.order_id || '');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={delivery.status === 'assigned'}
                                            className="btn-secondary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Verify Delivery
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
