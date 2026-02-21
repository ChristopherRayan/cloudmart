'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import api, { apiGet } from '@/lib/api';
import { DeliveryLocation, ApiResponse, GeofenceResult } from '@/types';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

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

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
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

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

    useEffect(() => {
        if (user) {
            setCustomerName(user.name || '');
            setCustomerPhone(user.phone || '');
            setCustomerAddress(user.address || '');
        }
    }, [user, isOpen]);

    useEffect(() => {
        if (isOpen) {
            apiGet<ApiResponse<DeliveryLocation[]>>('/delivery-locations', { cacheTtlMs: 300000 })
                .then((res) => setDeliveryLocations(normalizeDeliveryLocations(res.data.data)))
                .catch((err) => {
                    console.error(err);
                    setDeliveryLocations([]);
                });
        }
    }, [isOpen]);

    useEffect(() => {
        const validateLocation = async () => {
            if (coords && isOpen) {
                setValidatingGeofence(true);
                try {
                    const res = await api.post<ApiResponse<GeofenceResult>>('/geofence/validate', {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    });
                    setGeofenceStatus(res.data.data);

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
    }, [coords, isOpen]);

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
            refreshCart();
            onClose();
            router.push(`/orders/${res.data.data.order_id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Checkout failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl">
            <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                {/* Header */}
                <div className="sticky top-0 bg-dark-900 z-10 p-6 border-b border-dark-700 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-dark-100">Checkout</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-dark-100 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Sections */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Contact Details */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-4 text-dark-100 italic underline">Contact Information</h3>
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
                                            className="input-field min-h-[60px]"
                                            placeholder="Where should we deliver?"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Location */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-4 text-dark-100 italic underline">Delivery Location</h3>
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={requestLocation}
                                        disabled={geoLoading || validatingGeofence}
                                        className="btn-secondary w-full py-2 text-sm flex items-center justify-center gap-2"
                                    >
                                        {geoLoading ? 'Locating...' : validatingGeofence ? 'Verifying...' : '📍 Use My Current Location'}
                                    </button>
                                </div>

                                {geofenceStatus && (
                                    <div className={`mb-4 p-3 rounded-lg text-sm border ${geofenceStatus.isValid
                                        ? 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        {geofenceStatus.isValid
                                            ? `✅ Confirmed inside ${geofenceStatus.zoneName}`
                                            : `❌ You seem to be outside our zones. Nearest: ${geofenceStatus.nearestZone}`}
                                    </div>
                                )}

                                <select
                                    value={selectedLocationId || ''}
                                    onChange={(e) => {
                                        const nextValue = e.target.value;
                                        setSelectedLocationId(nextValue ? Number(nextValue) : null);
                                    }}
                                    className="input-field"
                                    required
                                >
                                    <option value="">-- Choose a delivery point --</option>
                                    {deliveryLocations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name || loc.zone_name || `Zone ${loc.id}`}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-4 text-dark-100 italic underline">Payment Method</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-3 rounded-xl border text-left transition-all ${paymentMethod === 'cash'
                                            ? 'bg-primary-600/10 border-primary-500 text-primary-400 ring-1 ring-primary-500'
                                            : 'bg-dark-800 border-dark-600 text-dark-300'
                                            }`}
                                    >
                                        <span className="font-semibold block">Cash on Delivery</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('mobile_money')}
                                        className={`p-3 rounded-xl border text-left transition-all ${paymentMethod === 'mobile_money'
                                            ? 'bg-primary-600/10 border-primary-500 text-primary-400 ring-1 ring-primary-500'
                                            : 'bg-dark-800 border-dark-600 text-dark-300'
                                            }`}
                                    >
                                        <span className="font-semibold block">Airtel Money / Mpamba</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="card h-full flex flex-col">
                                <h3 className="text-lg font-bold text-dark-100 mb-6 italic underline">Order Summary</h3>
                                <div className="flex-grow space-y-4 mb-6">
                                    {cart?.items.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-dark-300 line-clamp-1 flex-1 mr-2">{item.product.name} x {item.quantity}</span>
                                            <span className="text-dark-100 font-medium shrink-0">MWK {Number(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-dark-700 pt-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-dark-400">Total</span>
                                        <span className="text-xl font-bold text-primary-400">MWK {Number(totalAmount).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedLocationId}
                                    className="btn-primary w-full py-3"
                                >
                                    {isSubmitting ? 'Processing...' : 'Place Order'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
