'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { ApiResponse, Analytics, Order } from '@/types';
import Link from 'next/link';

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await apiGet<ApiResponse<Analytics>>('/admin/analytics', { cacheTtlMs: 20000 });
            setAnalytics(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!analytics) return null;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-dark-100 mb-8">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`MWK ${Number(analytics.total_revenue).toLocaleString()}`}
                    icon="💰"
                    trend="+12% from last month"
                />
                <StatCard
                    title="Orders Today"
                    value={analytics.orders_today}
                    icon="📦"
                    trend={`${analytics.orders_this_month} this month`}
                />
                <StatCard
                    title="Total Customers"
                    value={analytics.total_users}
                    icon="👥"
                    trend="Active users"
                />
                <StatCard
                    title="Low Stock Items"
                    value={analytics.low_stock_products}
                    icon="⚠️"
                    alert={analytics.low_stock_products > 0}
                    trend="Needs attention"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-dark-100">Recent Orders</h3>
                        <Link href="/admin/orders" className="text-sm text-primary-400 hover:text-primary-300">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {analytics.recent_orders.map(order => (
                            <div key={order.id} className="flex justify-between items-center p-3 hover:bg-dark-800/50 rounded-lg transition-colors border border-transparent hover:border-dark-700">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-dark-200">#{order.order_id}</span>
                                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full 
                                            ${order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-blue-500/10 text-blue-500'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-dark-400 mt-1">by {order.user?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-dark-100">MWK {Number(order.total_amount).toLocaleString()}</p>
                                    <p className="text-xs text-dark-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 className="font-bold text-xl text-dark-100 mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/admin/products" className="p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors text-center group">
                            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">➕</span>
                            <span className="font-medium text-dark-200">Add Product</span>
                        </Link>
                        <Link href="/admin/users" className="p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors text-center group">
                            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">👥</span>
                            <span className="font-medium text-dark-200">Manage Users</span>
                        </Link>
                        <Link href="/admin/reports" className="p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors text-center group">
                            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">🚩</span>
                            <span className="font-medium text-dark-200">View Reports</span>
                        </Link>
                        <Link href="/admin/settings" className="p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors text-center group">
                            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">⚙️</span>
                            <span className="font-medium text-dark-200">Settings</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, alert = false, trend }: any) {
    return (
        <div className={`card relative overflow-hidden group ${alert ? 'border-l-4 border-l-red-500' : ''}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                <span className="text-6xl">{icon}</span>
            </div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-dark-400 text-sm font-medium uppercase tracking-wider">{title}</span>
                    <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-2xl font-bold text-dark-100 mb-1">{value}</p>
                {trend && <p className="text-xs text-dark-500">{trend}</p>}
            </div>
        </div>
    );
}
