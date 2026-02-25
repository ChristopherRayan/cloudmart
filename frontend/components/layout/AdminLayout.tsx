'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    {
        name: 'Dashboard',
        href: '/admin',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: 'Orders',
        href: '/admin/orders',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
        ),
    },
    {
        name: 'Products',
        href: '/admin/products',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
    {
        name: 'Categories',
        href: '/admin/categories',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
    },
    {
        name: 'Users',
        href: '/admin/users',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        name: 'Analytics',
        href: '/admin/analytics',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        name: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        name: 'Reports',
        href: '/admin/reports',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H11l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
        ),
    },
    {
        name: 'Settings',
        href: '/admin/settings',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { user, logout, updateUser } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarFallbackDataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23111827'/%3E%3Ccircle cx='32' cy='24' r='10' fill='%23d1d5db'/%3E%3Cpath d='M14 54c2-9 10-14 18-14s16 5 18 14' fill='%23d1d5db'/%3E%3C/svg%3E";

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
        .slice(0, 2) || 'A';

    return (
        <div className="min-h-screen bg-dark-950 flex">
            {/* ── Sidebar ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-[72px]' : 'w-60'}`}
                style={{
                    background: 'linear-gradient(180deg, #0d1117 0%, #0f1923 50%, #0d1117 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
                }}
            >
                {/* Logo */}
                <div
                    className="flex items-center h-16 px-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <Link href="/" className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}
                        >
                            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                                <path d="M6 2l1.5 4.5H19l-2 8H7L5 2H2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="20" r="1.5" />
                                <circle cx="17" cy="20" r="1.5" />
                            </svg>
                        </div>
                        <span
                            className={`font-bold text-white text-lg tracking-tight transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                        >
                            Cloudi<span style={{ color: '#f97316' }}>mart</span>
                        </span>
                    </Link>
                </div>

                {/* Nav label */}
                {!isCollapsed && (
                    <p className="px-4 pt-5 pb-2 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Navigation
                    </p>
                )}

                {/* Nav items */}
                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-1" style={{ paddingTop: isCollapsed ? '20px' : undefined }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={isCollapsed ? item.name : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                                    ${isActive
                                        ? 'text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                style={isActive ? {
                                    background: 'linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(239,68,68,0.12) 100%)',
                                    boxShadow: 'inset 0 0 0 1px rgba(249,115,22,0.25)',
                                } : undefined}
                            >
                                {/* Active indicator bar */}
                                {isActive && (
                                    <span
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                                        style={{ background: 'linear-gradient(180deg, #f97316, #ef4444)', boxShadow: '0 0 8px rgba(249,115,22,0.8)' }}
                                    />
                                )}

                                {/* Icon */}
                                <span
                                    className={`flex-shrink-0 transition-all duration-200 ${isActive ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                                    style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.6))' } : undefined}
                                >
                                    {item.icon}
                                </span>

                                {/* Label */}
                                <span
                                    className={`font-medium text-sm whitespace-nowrap transition-all duration-300
                                        ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                                >
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div
                    className="p-3 space-y-1 flex-shrink-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                            text-slate-400 hover:text-white hover:bg-white/5 ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            {isDark ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                                </svg>
                            )}
                        </span>
                        <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                            {isDark ? 'Dark Mode' : 'Light Mode'}
                        </span>
                    </button>

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
                                style={!user?.profile_image_url ? { background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', boxShadow: '0 2px 8px rgba(249,115,22,0.35)' } : {}}
                            >
                                {user?.profile_image_url ? (
                                    <img
                                        src={user.profile_image_url}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                        onError={(event) => {
                                            const target = event.currentTarget;
                                            if (target.src !== avatarFallbackDataUrl) {
                                                target.src = avatarFallbackDataUrl;
                                            }
                                        }}
                                    />
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
                            <p className="text-[11px] text-slate-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-[72px]' : 'ml-60'}`}>
                {/* Top bar */}
                <header
                    className="h-14 flex items-center justify-between px-6 sticky top-0 z-40 flex-shrink-0"
                    style={{
                        background: 'rgba(13,17,23,0.85)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    {/* Collapse toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all duration-200"
                        aria-label="Toggle sidebar"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                            {isCollapsed ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" />
                            )}
                        </svg>
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">
                            Welcome back,{' '}
                            <span className="font-semibold text-slate-200">{user?.name?.split(' ')[0]}</span>
                        </span>
                        {/* Online indicator */}
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-green-400"
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Online
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
