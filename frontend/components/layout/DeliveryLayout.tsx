'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api, { apiGet } from '@/lib/api';
import toast from 'react-hot-toast';

interface DeliveryLayoutProps {
    children: React.ReactNode;
}

interface DeliveryNotificationItem {
    id: string;
    type: string;
    read_at: string | null;
    data?: {
        event?: string;
        message?: string;
    };
}

interface NotificationsApiResponse {
    success: boolean;
    data: DeliveryNotificationItem[];
}

const navItems = [
    {
        name: 'Active Deliveries',
        href: '/delivery/dashboard',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
    {
        name: 'Delivery History',
        href: '/delivery/history',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
    },
];

export default function DeliveryLayout({ children }: DeliveryLayoutProps) {
    const { user, logout, updateUser } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const seenNotificationsRef = useRef<Set<string>>(new Set());
    const isPollingNotificationsRef = useRef(false);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const response = await api.post('/profile/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (user && response.data.data) {
                updateUser({
                    ...user,
                    profile_image: response.data.data.profile_image,
                    profile_image_url: response.data.data.profile_image_url
                });
                toast.success('Profile image updated');
            }
        } catch (error) {
            console.error('Failed to upload image', error);
            toast.error('Failed to upload profile image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const initials = user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'D';

    useEffect(() => {
        if (user?.role !== 'delivery_staff') {
            return;
        }

        const pollNotifications = async () => {
            if (isPollingNotificationsRef.current) return;

            try {
                isPollingNotificationsRef.current = true;
                const response = await apiGet<NotificationsApiResponse>('/notifications', {
                    cacheTtlMs: 3000,
                    forceRefresh: true,
                });

                const notifications = Array.isArray(response.data?.data) ? response.data.data : [];

                for (const notification of notifications) {
                    if (!notification?.id || seenNotificationsRef.current.has(notification.id)) {
                        continue;
                    }
                    seenNotificationsRef.current.add(notification.id);

                    const isAssignmentEvent =
                        notification?.data?.event === 'delivery_assigned' ||
                        String(notification?.type || '').includes('DeliveryAssignedNotification');

                    if (!isAssignmentEvent || notification?.read_at) {
                        continue;
                    }

                    const message = notification?.data?.message || 'New delivery assigned to you.';
                    toast.success(message);

                    await api.post(`/notifications/${notification.id}/read`).catch(() => {
                        // Keep user feedback even if read status update fails.
                    });
                }
            } catch (error) {
                // Silent fail for background polling.
            } finally {
                isPollingNotificationsRef.current = false;
            }
        };

        void pollNotifications();
        const interval = setInterval(() => {
            void pollNotifications();
        }, 20000);

        return () => clearInterval(interval);
    }, [user?.id, user?.role]);

    return (
        <div className="min-h-screen bg-dark-950 flex">
            {/* ── Sidebar ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-[72px]' : 'w-60'}`}
                style={{
                    background: 'linear-gradient(180deg, #0d1117 0%, #0b1420 50%, #0d1117 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
                }}
            >
                {/* Logo */}
                <div
                    className="flex items-center h-16 px-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                        </div>
                        <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                            <p className="font-bold text-white text-sm leading-tight">Delivery</p>
                            <p className="text-[11px]" style={{ color: '#3b82f6' }}>Operations Centre</p>
                        </div>
                    </div>
                </div>

                {/* Status badge */}
                {!isCollapsed && (
                    <div className="mx-3 mt-4 mb-1 px-3 py-2 rounded-xl flex items-center gap-2"
                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                        <span className="text-xs font-medium text-green-400">On Duty</span>
                    </div>
                )}

                {/* Nav label */}
                {!isCollapsed && (
                    <p className="px-4 pt-4 pb-2 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Quick Access
                    </p>
                )}

                {/* Nav items */}
                <nav className="flex-1 px-3 space-y-0.5 py-1" style={{ paddingTop: isCollapsed ? '20px' : undefined }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={isCollapsed ? item.name : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                                    ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                style={isActive ? {
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.12) 100%)',
                                    boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.25)',
                                } : undefined}
                            >
                                {/* Active bar */}
                                {isActive && (
                                    <span
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                                        style={{ background: 'linear-gradient(180deg, #3b82f6, #6366f1)', boxShadow: '0 0 8px rgba(59,130,246,0.8)' }}
                                    />
                                )}
                                <span
                                    className={`flex-shrink-0 transition-all duration-200 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                                    style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.6))' } : undefined}
                                >
                                    {item.icon}
                                </span>
                                <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="p-3 space-y-1 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                            text-red-400/70 hover:text-red-400 hover:bg-red-500/8 ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </span>
                        <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                            Sign Out
                        </span>
                    </button>

                    {/* User card (Upload) */}
                    <div
                        onClick={handleAvatarClick}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 cursor-pointer hover:bg-white/5 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                        title="Click to upload profile image"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <div className="relative">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden"
                                style={!user?.profile_image_url ? { background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', boxShadow: '0 2px 8px rgba(59,130,246,0.35)' } : {}}
                            >
                                {user?.profile_image_url ? (
                                    <img src={user.profile_image_url} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    initials
                                )}
                            </div>
                            {/* Hover overlay hint */}
                            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center z-10">
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 min-w-0 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                            <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name}</p>
                            <p className="text-[11px] text-slate-500">Delivery Staff</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-[72px]' : 'ml-60'}`}>
                {/* Topbar */}
                <header
                    className="h-14 flex items-center justify-between px-4 sm:px-8 lg:px-12 sticky top-0 z-40 flex-shrink-0"
                    style={{
                        background: 'rgba(13,17,23,0.85)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all duration-200"
                        aria-label="Toggle sidebar"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">
                            Welcome, <span className="font-semibold text-slate-200">{user?.name?.split(' ')[0]}</span>
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-green-400"
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            On Duty
                        </span>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
