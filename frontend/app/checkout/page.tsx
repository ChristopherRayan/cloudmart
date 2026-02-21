'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { apiGet } from '@/lib/api';
import { DeliveryLocation, ApiResponse, GeofenceResult } from '@/types';
import toast from 'react-hot-toast';

type DeliveryLocationOption = DeliveryLocation & { zone_name?: string };

function normalizeDeliveryLocations(data: unknown): DeliveryLocationOption[] {
    if (Array.isArray(data)) {
        return data as DeliveryLocationOption[];
    }

    if (data && typeof data === 'object') {
        const maybePaginated = data as { data?: unknown };
        if (Array.isArray(maybePaginated.data)) {
            return maybePaginated.data as DeliveryLocationOption[];
        }
    }

    return [];
}

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, totalAmount, refreshCart } = useCart();
    const { user } = useAuth();
    const { coords, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();

    const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocationOption[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money'>('cash');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [geofenceStatus, setGeofenceStatus] = useState<GeofenceResult | null>(null);
    const [validatingGeofence, setValidatingGeofence] = useState(false);

    // Contact details state
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

    // Pre-fill from user profile
    useEffect(() => {
        if (user) {
            setCustomerName(user.name || '');
            setCustomerPhone(user.phone || '');
            setCustomerAddress(user.address || '');
        }
    }, [user]);

    // Fetch delivery locations on mount
    useEffect(() => {
        apiGet<ApiResponse<DeliveryLocation[]>>('/delivery-locations', { cacheTtlMs: 300000 })
            .then((res) => setDeliveryLocations(normalizeDeliveryLocations(res.data.data)))
            .catch((err) => {
                console.error(err);
                setDeliveryLocations([]);
            });
    }, []);

    // Validate geofence when coords change
    useEffect(() => {
        const validateLocation = async () => {
            if (coords) {
                setValidatingGeofence(true);
                try {
                    const res = await api.post<ApiResponse<GeofenceResult>>('/geofence/validate', {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    });
                    setGeofenceStatus(res.data.data);

                    // Auto-select zone if valid
                    if (res.data.data.isValid && res.data.data.zoneId) {
                        setSelectedLocationId(res.data.data.zoneId);
                        toast.success(`Location verified: ${res.data.data.zoneName}`);
                    } else {
                        toast.error('You calculate to be outside our delivery zones.');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to validate location.');
                } finally {
                    setValidatingGeofence(false);
                }
            }
        };

        validateLocation();
    }, [coords]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLocationId) {
            toast.error('Please select a delivery location');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post('/checkout', {
                delivery_location_id: selectedLocationId,
                payment_method: paymentMethod,
                notes,
                latitude: coords?.latitude,
                longitude: coords?.longitude,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_address: customerAddress,
            });

            toast.success('Order placed successfully!');
            router.push(`/orders/${res.data.data.order_id}`);
            refreshCart();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Checkout failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-950">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-dark-400 mb-4">Your cart is empty.</p>
                        <button onClick={() => router.push('/products')} className="btn-primary">Go Shopping</button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Header />

            <main className="flex-grow mx-auto px-4 w-full py-12">
                <h1 className="text-3xl font-bold text-dark-100 mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 0. Contact Information */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 text-dark-100">0. Contact Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Full Name</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="input-field"
                                        placeholder="Your Name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Phone Number</label>
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g. 0888..."
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="label">Delivery Address</label>
                                    <textarea
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        className="input-field min-h-[80px]"
                                        placeholder="Where should we deliver? (e.g. Near Science Lab, Room 12)"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 1. Location Selection */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 text-dark-100">1. Delivery Location</h2>

                            <div className="mb-6 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-primary-400 mb-1">Geofence Validation</h3>
                                        <p className="text-sm text-dark-400">
                                            We use GPS to verify you are within our delivery zones (Mzuzu University & Luwinga).
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={requestLocation}
                                        disabled={geoLoading || validatingGeofence}
                                        className="btn-secondary text-sm py-2 px-3"
                                    >
                                        {geoLoading ? 'Locating...' : validatingGeofence ? 'Verifying...' : '📍 Use My Location'}
                                    </button>
                                </div>

                                {geoError && (
                                    <p className="text-red-400 text-sm mt-3">⚠️ {geoError}</p>
                                )}

                                {geofenceStatus && (
                                    <div className={`mt-3 p-3 rounded-lg text-sm border ${geofenceStatus.isValid
                                        ? 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        {geofenceStatus.isValid
                                            ? `✅ Confirmed inside ${geofenceStatus.zoneName}`
                                            : `❌ You seem to be outside our zones. Nearest: ${geofenceStatus.nearestZone}`}
                                    </div>
                                )}
                            </div>

                            <label className="label">Select Delivery Point</label>
                            <select
                                value={selectedLocationId || ''}
                                onChange={(e) => {
                                    const nextValue = e.target.value;
                                    setSelectedLocationId(nextValue ? Number(nextValue) : null);
                                }}
                                className="input-field"
                            >
                                <option value="">-- Choose a location --</option>
                                {deliveryLocations.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name || loc.zone_name || `Zone ${loc.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Payment Method */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 text-dark-100">2. Payment Method</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`p-4 rounded-xl border transition-all text-left ${paymentMethod === 'cash'
                                        ? 'bg-primary-600/10 border-primary-500 text-primary-400 ring-1 ring-primary-500'
                                        : 'bg-dark-800 border-dark-600 hover:border-dark-500 text-dark-300'
                                        }`}
                                >
                                    <span className="text-2xl block mb-2">💵</span>
                                    <span className="font-semibold block">Cash on Delivery</span>
                                    <span className="text-xs opacity-70">Pay when you receive your order</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('mobile_money')}
                                    className={`p-4 rounded-xl border transition-all text-left ${paymentMethod === 'mobile_money'
                                        ? 'bg-primary-600/10 border-primary-500 text-primary-400 ring-1 ring-primary-500'
                                        : 'bg-dark-800 border-dark-600 hover:border-dark-500 text-dark-300'
                                        }`}
                                >
                                    <span className="text-2xl block mb-2">📱</span>
                                    <span className="font-semibold block">Airtel Money / Mpamba</span>
                                    <span className="text-xs opacity-70">Pay via agent upon delivery</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Notes */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 text-dark-100">3. Delivery Notes (Optional)</h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="input-field min-h-[100px]"
                                placeholder="e.g. Call when near the library entrance..."
                            />
                        </div>

                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="card sticky top-24">
                            <h3 className="text-lg font-bold text-dark-100 mb-6">Order Preview</h3>

                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {cart.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-dark-800 rounded flex items-center justify-center shrink-0">📦</div>
                                            <div>
                                                <p className="text-dark-200">{item.product.name}</p>
                                                <p className="text-dark-400 text-xs">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="text-dark-300">MWK {Number(item.subtotal || item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-dark-700 pt-4 mb-6">
                                <div className="flex justify-between text-xl font-bold text-dark-100">
                                    <span>Total</span>
                                    <span className="gradient-text">MWK {Number(totalAmount).toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedLocationId}
                                className="btn-primary w-full py-4 text-lg shadow-xl shadow-primary-900/20"
                            >
                                {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
