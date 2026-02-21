'use client';

import { useState, useEffect } from 'react';
import api, { apiGet } from '@/lib/api';
import { ApiResponse, Order, User } from '@/types';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [deliveryStaff, setDeliveryStaff] = useState<User[]>([]);
    const [assigningOrder, setAssigningOrder] = useState<number | null>(null);

    useEffect(() => {
        fetchOrders();
        fetchDeliveryStaff();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await apiGet<ApiResponse<{ data: Order[] }>>('/admin/orders');
            setOrders(res.data.data.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchDeliveryStaff = async () => {
        try {
            const res = await apiGet<ApiResponse<{ data: User[] }>>('/admin/users?role=delivery_staff');
            setDeliveryStaff(res.data.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignDriver = async (orderId: number, driverId: string) => {
        if (!driverId) return;
        try {
            await api.patch(`/admin/orders/${orderId}/assign`, {
                delivery_person_id: Number(driverId)
            });
            toast.success('Driver assigned successfully');
            setAssigningOrder(null);
            fetchOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Assignment failed');
        }
    };

    const canAssignDriver = (status: Order['status']) =>
        ['pending', 'processing', 'out_for_delivery'].includes(status);

    const formatOrderStatus = (status: Order['status']) => {
        if (status === 'processing') return 'assigned';
        return status.replace(/_/g, ' ');
    };

    if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-dark-100">Orders Management</h1>
                <div className="flex gap-2">
                    <button onClick={fetchOrders} className="btn-secondary text-sm py-2">Refresh</button>
                </div>
            </div>

            <div className="grid gap-4">
                {orders.map(order => (
                    <div key={order.id} className="card flex flex-col md:flex-row justify-between gap-6 p-6">
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-lg text-dark-100">#{order.order_id}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs uppercase font-bold tracking-wide ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                        order.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                                            order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                                'bg-blue-500/20 text-blue-500'
                                    }`}>
                                    {formatOrderStatus(order.status)}
                                </span>
                                <span className="text-xs text-dark-400">{new Date(order.created_at).toLocaleString()}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">Customer</p>
                                    <p className="text-dark-200 font-medium">{order.user?.name}</p>
                                    <p className="text-sm text-dark-400">{order.user?.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">Items</p>
                                    <p className="text-dark-200">
                                        {order.order_items?.map(item => `${item.quantity}x ${item.product.name}`).join(', ') || 'No items'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">Location</p>
                                    <p className="text-dark-200">{order.delivery_location?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">Total</p>
                                    <p className="text-primary-400 font-bold">MWK {Number(order.total_amount).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center min-w-[200px] border-t md:border-t-0 md:border-l border-dark-700/50 pt-4 md:pt-0 md:pl-6">
                            {canAssignDriver(order.status) ? (
                                <div className="space-y-3">
                                    {assigningOrder === order.id ? (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <select
                                                className="input-field text-sm py-2"
                                                onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                                                defaultValue=""
                                                autoFocus
                                            >
                                                <option value="" disabled>Select Driver</option>
                                                {deliveryStaff.map(staff => (
                                                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                                                ))}
                                            </select>
                                            {deliveryStaff.length === 0 && (
                                                <p className="text-xs text-red-400 text-center">
                                                    No delivery staff available.
                                                </p>
                                            )}
                                            <button
                                                onClick={() => setAssigningOrder(null)}
                                                className="text-xs text-red-400 hover:text-red-300 w-full text-center"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => setAssigningOrder(order.id)}
                                                className="btn-primary w-full text-sm py-2"
                                            >
                                                {order.delivery?.delivery_person ? 'Reassign Driver' : 'Assign Driver'}
                                            </button>
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
                                                className="btn-accent w-full text-sm py-2 flex items-center justify-center gap-2"
                                            >
                                                <span>📄</span> Download Receipt
                                            </button>
                                        </div>
                                    )}

                                    {order.delivery?.delivery_person && (
                                        <div className="text-center p-2 bg-dark-800/50 rounded-lg">
                                            <p className="text-[10px] text-dark-400 uppercase tracking-widest">Assigned To</p>
                                            <p className="text-sm font-medium text-primary-400">{order.delivery.delivery_person.name}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-center p-4 bg-dark-800/30 rounded-xl">
                                        <span className="text-2xl block mb-2">
                                            {order.status === 'delivered' ? '✅' : order.status === 'cancelled' ? '❌' : '🚚'}
                                        </span>
                                        <p className="text-sm font-medium text-dark-300 capitalize">Order {formatOrderStatus(order.status)}</p>
                                    </div>
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
                                        className="btn-accent w-full text-sm py-2 flex items-center justify-center gap-2"
                                    >
                                        <span>📄</span> Download Receipt
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {orders.length === 0 && (
                    <div className="text-center py-12 text-dark-400">
                        No orders found.
                    </div>
                )}
            </div>
        </div>
    );
}
