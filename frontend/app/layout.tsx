import type { Metadata } from 'next';
import AppProviders from '@/components/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
    title: 'Cloudimart - Campus Delivery Made Easy',
    description: 'Geofenced e-commerce platform for Mzuzu University community. Shop groceries, stationery, electronics and more with campus-wide delivery.',
    keywords: 'Mzuzu University, campus delivery, e-commerce, Malawi, groceries, stationery',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
