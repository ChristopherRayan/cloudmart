'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ProductProvider } from '@/contexts/ProductContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const SupportChatbot = dynamic(() => import('@/components/shared/SupportChatbot'), {
    ssr: false,
});

const CUSTOMER_EXCLUDED_PREFIXES = ['/admin', '/delivery', '/login', '/register'];

function isCustomerRoute(pathname: string | null): boolean {
    if (!pathname) {
        return true;
    }

    return !CUSTOMER_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const customerRoute = isCustomerRoute(pathname);

    return (
        <ThemeProvider>
            <AuthProvider>
                {customerRoute ? (
                    <CartProvider>
                        <ProductProvider>
                            {children}
                            <SupportChatbot />
                        </ProductProvider>
                    </CartProvider>
                ) : (
                    children
                )}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'var(--toast-bg)',
                            color: 'var(--toast-color)',
                            border: '1px solid var(--toast-border)',
                            borderRadius: '12px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22c55e',
                                secondary: 'var(--toast-color)',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: 'var(--toast-color)',
                            },
                        },
                    }}
                />
            </AuthProvider>
        </ThemeProvider>
    );
}
