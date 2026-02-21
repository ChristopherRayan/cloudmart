'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, hasRole, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !hasRole('admin')) {
            router.push('/');
        }
    }, [user, isLoading, hasRole, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!hasRole('admin')) {
        return null;
    }

    return <AdminLayout>{children}</AdminLayout>;
}
