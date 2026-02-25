'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api, { apiGet } from '@/lib/api';

export default function Header() {
    const { user, isAuthenticated, logout, hasRole } = useAuth();
    const { totalItems } = useCart();
    const { theme, toggleTheme, isDark } = useTheme();
    const pathname = usePathname();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch notifications
    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
        if (isAuthRoute) {
            return;
        }

        const fetchNotifications = async () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            try {
                const response = await apiGet('/notifications', { cacheTtlMs: 15000 });
                if (response.data.success) {
                    const data = response.data.data;
                    setNotifications(data);
                    setUnreadCount(data.filter((n: any) => !n.read_at).length);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        void fetchNotifications();

        const interval = setInterval(fetchNotifications, 60000);
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void fetchNotifications();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isAuthenticated, pathname]);

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read_at: new Date() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleSignOut = async () => {
        await logout();
        setProfileMenuOpen(false);
        router.push('/login');
    };

    const isHomePage = pathname === '/';

    return (
        <header className={isHomePage ? 'fixed inset-x-0 top-0 z-50 bg-transparent' : 'sticky top-0 z-50 glass border-b border-dark-700/50'}>
            <div className="w-full px-4 sm:px-8 lg:px-12">
                <div className={`flex items-center justify-between h-16 ${isHomePage ? 'mt-2 sm:mt-3' : ''}`}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <span className="text-xl font-bold gradient-text hidden sm:block">Cloudimart</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link href="/products" className={`transition-colors text-sm font-medium ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-300 hover:text-primary-400'}`}>
                            Products
                        </Link>
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center space-x-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="theme-toggle group relative"
                            aria-label="Toggle theme"
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <span className="theme-toggle-knob transition-transform duration-300 group-hover:scale-110">
                                {isDark ? '🌙' : '☀️'}
                            </span>
                        </button>

                        {isAuthenticated ? (
                            <>
                                {/* Notifications */}
                                <div className="relative" ref={notificationsRef}>
                                    <button
                                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                                        className={`relative p-2 transition-colors ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-300 hover:text-primary-400'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 bg-primary-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {notificationsOpen && (
                                        <div className="absolute right-0 mt-3 w-80 card py-2 z-50 animate-scale-in origin-top-right shadow-2xl border border-dark-700/50 backdrop-blur-xl">
                                            <div className="px-4 py-2 border-b border-dark-700/50 flex justify-between items-center bg-dark-800/30">
                                                <h3 className="text-sm font-bold text-dark-100">Notifications</h3>
                                                <span className="text-[10px] text-primary-400 font-bold uppercase">{unreadCount} New</span>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            className={`px-4 py-3 border-b border-dark-700/30 hover:bg-white/5 transition-colors cursor-pointer ${!n.read_at ? 'bg-primary-500/5' : ''}`}
                                                            onClick={() => markAsRead(n.id)}
                                                        >
                                                            <p className="text-xs text-dark-200 font-medium">{n.data.message}</p>
                                                            <p className="text-[10px] text-dark-400 mt-1">
                                                                {new Date(n.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-8 text-center">
                                                        <p className="text-xs text-dark-400">No notifications yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cart - Hidden for admin users */}
                                {!hasRole('admin') && (
                                    <Link href="/cart" className={`relative p-2 transition-colors ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-300 hover:text-primary-400'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                        </svg>
                                        {totalItems > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                                {totalItems}
                                            </span>
                                        )}
                                    </Link>
                                )}

                                {/* User menu */}
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className={`flex items-center space-x-2 p-1 rounded-full transition-all duration-300 group ${isHomePage ? 'border border-white/25 bg-white/10 hover:bg-white/15' : 'border border-dark-700/50 bg-dark-800/50 hover:bg-dark-700/50'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-primary-500/50 group-hover:border-primary-400 transition-colors">
                                            {user?.profile_image_url ? (
                                                <img src={user.profile_image_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">{user?.name?.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`hidden sm:block text-sm font-medium pr-2 transition-colors ${isHomePage ? 'text-white/90 group-hover:text-white' : 'text-dark-200 group-hover:text-primary-400'}`}>
                                            {user?.name?.split(' ')[0]}
                                        </span>
                                        <svg className={`w-4 h-4 transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''} ${isHomePage ? 'text-white/70 group-hover:text-white' : 'text-dark-400 group-hover:text-primary-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {profileMenuOpen && (
                                        <div className="absolute right-0 mt-3 w-64 card py-2 z-50 animate-scale-in origin-top-right shadow-2xl border border-dark-700/50 backdrop-blur-xl">
                                            <div className="px-4 py-3 border-b border-dark-700/50 mb-2 bg-dark-800/30">
                                                <p className="text-sm font-bold text-dark-100">{user?.name}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-primary-400 font-bold mt-0.5">{user?.role?.replace('_', ' ')}</p>
                                                <p className="text-xs text-dark-400 truncate mt-1">{user?.email}</p>
                                            </div>

                                            {hasRole('admin') && (
                                                <Link
                                                    href="/admin"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-primary-400 hover:bg-primary-500/5 transition-colors"
                                                    onClick={() => setProfileMenuOpen(false)}
                                                >
                                                    📊 Admin Dashboard
                                                </Link>
                                            )}

                                            {hasRole('delivery_staff') && (
                                                <Link
                                                    href="/delivery/dashboard"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-primary-400 hover:bg-primary-500/5 transition-colors"
                                                    onClick={() => setProfileMenuOpen(false)}
                                                >
                                                    🚚 Delivery Dashboard
                                                </Link>
                                            )}

                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-primary-400 hover:bg-primary-500/5 transition-colors"
                                                onClick={() => setProfileMenuOpen(false)}
                                            >
                                                👤 Profile Settings
                                            </Link>

                                            {!hasRole('delivery_staff') && !hasRole('admin') && (
                                                <Link
                                                    href="/orders"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-primary-400 hover:bg-primary-500/5 transition-colors"
                                                    onClick={() => setProfileMenuOpen(false)}
                                                >
                                                    📦 My Orders
                                                </Link>
                                            )}

                                            <Link
                                                href="/report"
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-primary-400 hover:bg-primary-500/5 transition-colors"
                                                onClick={() => setProfileMenuOpen(false)}
                                            >
                                                🚩 Report Issue
                                            </Link>

                                            <div className="border-t border-dark-700/50 my-2"></div>

                                            <button
                                                onClick={handleSignOut}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors flex items-center gap-3"
                                            >
                                                🚪 Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link href="/login" className={`text-sm font-medium transition-colors p-2 ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-300 hover:text-primary-400'}`}>
                                    Sign In
                                </Link>
                                <Link href="/register" className="btn-primary text-sm py-2 px-5">
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`md:hidden p-2 transition-colors ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-300 hover:text-primary-400'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Panel */}
                {mobileMenuOpen && (
                    <div className={`md:hidden py-4 px-4 space-y-4 animate-fade-in ${isHomePage ? 'mt-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl backdrop-saturate-150' : 'glass border-t border-dark-700/50'}`}>
                        <Link href="/products" className={`block font-medium py-2 ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-200'}`} onClick={() => setMobileMenuOpen(false)}>
                            Products
                        </Link>
                        {isAuthenticated && (
                            <>
                                {hasRole('delivery_staff') && (
                                    <Link href="/delivery/dashboard" className={`block font-medium py-2 ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-200'}`} onClick={() => setMobileMenuOpen(false)}>
                                        Deliveries
                                    </Link>
                                )}
                                {hasRole('admin') && (
                                    <Link href="/admin" className={`block font-medium py-2 ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-200'}`} onClick={() => setMobileMenuOpen(false)}>
                                        Admin Dashboard
                                    </Link>
                                )}
                                <Link href="/profile" className={`block font-medium py-2 ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-200'}`} onClick={() => setMobileMenuOpen(false)}>
                                    Profile Settings
                                </Link>
                                {!hasRole('delivery_staff') && !hasRole('admin') && (
                                    <Link href="/orders" className={`block font-medium py-2 ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-200'}`} onClick={() => setMobileMenuOpen(false)}>
                                        My Orders
                                    </Link>
                                )}
                                <Link href="/report" className={`block font-medium py-2 ${isHomePage ? 'text-white/90 hover:text-white' : 'text-dark-200'}`} onClick={() => setMobileMenuOpen(false)}>
                                    Report Issue
                                </Link>
                                <button onClick={handleSignOut} className="block w-full text-left text-red-400 font-medium py-2">
                                    Sign Out
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
