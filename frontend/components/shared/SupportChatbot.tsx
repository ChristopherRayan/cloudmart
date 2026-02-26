'use client';

import { ReactNode, useRef, useState } from 'react';
import Link from 'next/link';
import {
    MessageSquare,
    X,
    Home,
    ShoppingBag,
    ShoppingCart,
    Package,
    User,
    Bot,
    HelpCircle,
    Truck,
    ShieldCheck,
    CheckCircle2,
    ClipboardList,
    KeyRound,
    Route,
    FileText,
    CreditCard,
    LogIn,
    UserPlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Shortcut = {
    name: string;
    icon: ReactNode;
    path?: string;
    action?: () => void;
};

export default function SupportChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeliveryProcessGuide, setShowDeliveryProcessGuide] = useState(false);
    const deliveryProcessGuideRef = useRef<HTMLDivElement | null>(null);
    const { user, isAuthenticated, hasRole } = useAuth();
    const isAdmin = hasRole('admin');
    const isDeliveryStaff = hasRole('delivery_staff');
    const isGuest = !isAuthenticated;
    const isCustomer = isAuthenticated && !isAdmin && !isDeliveryStaff;
    const roleGuideLabel = isAdmin
        ? 'Admin Guide'
        : isDeliveryStaff
            ? 'Delivery Staff Guide'
            : isCustomer
                ? 'Customer Guide'
                : 'New User Guide';

    const handleDeliveryProcessShortcut = () => {
        setShowDeliveryProcessGuide(true);

        setTimeout(() => {
            deliveryProcessGuideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const shortcuts: Shortcut[] = [
        { name: 'Delivery Process', icon: <Route size={18} />, action: handleDeliveryProcessShortcut },
        { name: 'Home', path: '/', icon: <Home size={18} /> },
        { name: 'Products', path: '/products', icon: <ShoppingBag size={18} /> },
        { name: 'My Cart', path: '/cart', icon: <ShoppingCart size={18} /> },
        { name: 'My Orders', path: '/orders', icon: <Package size={18} /> },
        { name: 'Account settings', path: '/profile', icon: <User size={18} /> },
        { name: 'Report Issue', path: '/report', icon: <HelpCircle size={18} /> },
    ];

    if (isGuest) {
        shortcuts.unshift(
            { name: 'Sign In', path: '/login', icon: <LogIn size={18} /> },
            { name: 'Create Account', path: '/register', icon: <UserPlus size={18} /> }
        );
    }

    if (isDeliveryStaff) {
        shortcuts.unshift({ name: 'Delivery Dashboard', path: '/delivery/dashboard', icon: <Truck size={18} /> });
    }

    if (isAdmin) {
        shortcuts.unshift({ name: 'Admin Dashboard', path: '/admin', icon: <ShieldCheck size={18} /> });
    }

    const onboardingGuide = [
        'Create an account or sign in from the Login page.',
        'After login, use Home and Products to start shopping.',
        'Open your profile page and complete phone/address details.',
        'Use My Cart and My Orders to manage purchases.',
        'Use Report Issue anytime if you need admin support.',
    ];

    const customerGuide = [
        'Go to Products and browse categories, search, or sorting options.',
        'Open a product, confirm stock, then click Add to cart.',
        'Open Cart, adjust quantity, and review totals.',
        'Proceed to checkout and select an admin-configured delivery location.',
        'Place your order and track status updates in My Orders.',
        'Open an order detail page to view invoice and delivery code/token.',
    ];

    const checkoutGuide = [
        'Sign in first. Guests cannot complete checkout.',
        'Ensure every cart item is in stock.',
        'Choose a valid delivery location from the dropdown.',
        'Confirm your contact details before placing the order.',
        'After success, keep your order ID and 4-digit delivery code.',
    ];

    const orderTrackingGuide = [
        'pending: order created and waiting for processing.',
        'assigned: admin has assigned delivery staff to your order.',
        'out_for_delivery: rider is on the way to your location.',
        'delivered: order was confirmed with your delivery code.',
    ];

    const deliveryTokenGuide = [
        'Your delivery token is the 4-digit delivery code shown in order details.',
        'Only share this code when the correct delivery staff arrives.',
        'Delivery staff must enter this exact code to complete delivery.',
        'If code is wrong, delivery cannot be marked as delivered.',
        'Do not share the code in advance through unsafe channels.',
    ];

    const invoiceGuide = [
        'After checkout, open My Orders and select an order.',
        'Review line items, totals, location, and status timeline.',
        'Use the invoice action to download or print the receipt PDF.',
        'Keep invoices for payment proof and support follow-up.',
    ];

    const deliveryGuide = [
        'Open Delivery Dashboard and review assigned orders only.',
        'Mark order as out_for_delivery before leaving pickup.',
        'At customer handover, ask for the exact 4-digit delivery code from their order.',
        'Enter the code in delivery confirmation. Only exact code matches are accepted.',
        'Once verified, status moves to delivered with timestamp and staff audit trail.',
    ];

    const deliveryProcessShortcutGuide = [
        'Browse products and add items to cart.',
        'Checkout with an active admin-configured delivery location.',
        'Track your order status from pending to out_for_delivery.',
        'At handover, provide the 4-digit delivery code shown in your order.',
        'Delivery staff verifies the code to complete a successful delivery.',
    ];

    const adminGuide = [
        'Create categories and products with valid images.',
        'Configure delivery locations and keep them active.',
        'Assign orders to delivery staff quickly from admin orders.',
        'Monitor analytics, reports, and audit logs daily.',
        'Update order status when assigned, out_for_delivery, and delivered.',
    ];

    const troubleshootingGuide = [
        'If pages break after updates, hard refresh: Ctrl+Shift+R.',
        'If images fail, re-open profile/product and upload image again.',
        'If checkout returns 422, confirm location and required fields are selected.',
        'If login succeeds but UI looks stale, sign out and sign in again.',
        'If data does not refresh, reload once and reopen the page.',
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[28rem] max-w-[95vw] bg-dark-900 border border-primary-500/50 rounded-2xl shadow-2xl overflow-hidden glass translate-y-[-10px] animate-slide-up ring-1 ring-primary-500/20">
                    <div className="bg-primary-600 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Bot size={24} />
                            <span className="font-bold">CloudMart Assistant v2</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 max-h-[76vh] overflow-y-auto space-y-4">
                        <div className="bg-dark-800 p-3 rounded-lg mb-4 border border-dark-700">
                            <p className="text-sm text-dark-100 flex items-start gap-2">
                                <span className="mt-1 text-primary-400">👋</span>
                                {isAuthenticated
                                    ? `Hello ${user?.name?.split(' ')[0] || ''}! Here is your complete CloudMart process guide.`
                                    : 'Hello! Here is the complete CloudMart process guide for new users.'}
                            </p>
                            <p className="text-[11px] text-primary-300 mt-2 uppercase tracking-widest font-semibold">
                                {roleGuideLabel}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {(isGuest || isCustomer) && (
                                <>
                                    {isGuest && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                                <CheckCircle2 size={12} />
                                                First Time Setup
                                            </h4>
                                            <ol className="text-xs text-dark-300 space-y-2 list-decimal pl-4">
                                                {onboardingGuide.map((step) => (
                                                    <li key={step}>{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                            <HelpCircle size={12} />
                                            Customer Flow: Browse to Delivery
                                        </h4>
                                        <ol className="text-xs text-dark-300 space-y-2 list-decimal pl-4">
                                            {customerGuide.map((step) => (
                                                <li key={step}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                            <ShoppingCart size={12} />
                                            Checkout Success Checklist
                                        </h4>
                                        <ol className="text-xs text-dark-300 space-y-2 list-decimal pl-4">
                                            {checkoutGuide.map((step) => (
                                                <li key={step}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                            <Route size={12} />
                                            Order Status Meaning
                                        </h4>
                                        <ul className="text-xs text-dark-300 space-y-2 list-disc pl-4">
                                            {orderTrackingGuide.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                            <KeyRound size={12} />
                                            Delivery Token (4-Digit Code)
                                        </h4>
                                        <ul className="text-xs text-dark-300 space-y-2 list-disc pl-4">
                                            {deliveryTokenGuide.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                            <FileText size={12} />
                                            Orders and Invoices
                                        </h4>
                                        <ol className="text-xs text-dark-300 space-y-2 list-decimal pl-4">
                                            {invoiceGuide.map((step) => (
                                                <li key={step}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                </>
                            )}

                            {isDeliveryStaff && (
                                <>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                            <Truck size={12} />
                                            Delivery Staff Flow
                                        </h4>
                                        <ol className="text-xs text-dark-300 space-y-2 list-decimal pl-4">
                                            {deliveryGuide.map((step) => (
                                                <li key={step}>{step}</li>
                                            ))}
                                        </ol>
                                        <p className="text-[11px] mt-2 text-primary-300 flex items-start gap-1">
                                            <CreditCard size={12} className="mt-0.5" />
                                            Delivery confirmation always uses the customer&apos;s order code/token.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                            <Route size={12} />
                                            Delivery Status Reference
                                        </h4>
                                        <ul className="text-xs text-dark-300 space-y-2 list-disc pl-4">
                                            {orderTrackingGuide.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}

                            {isAdmin && (
                                <>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                            <ClipboardList size={12} />
                                            Admin Essentials
                                        </h4>
                                        <ol className="text-xs text-dark-300 space-y-2 list-decimal pl-4">
                                            {adminGuide.map((step) => (
                                                <li key={step}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                            <Route size={12} />
                                            Order Status Governance
                                        </h4>
                                        <ul className="text-xs text-dark-300 space-y-2 list-disc pl-4">
                                            {orderTrackingGuide.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}

                            {showDeliveryProcessGuide && (
                                <div ref={deliveryProcessGuideRef}>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                        <Route size={12} />
                                        Delivery Process Shortcut
                                    </h4>
                                    <ol className="text-xs text-dark-300 space-y-2 list-decimal pl-4">
                                        {deliveryProcessShortcutGuide.map((step) => (
                                            <li key={step}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={12} />
                                    Quick Troubleshooting
                                </h4>
                                <ul className="text-xs text-dark-300 space-y-2 list-disc pl-4">
                                    {troubleshootingGuide.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                    <HelpCircle size={12} />
                                    Quick Shortcuts
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {shortcuts.map((s) => (
                                        s.action ? (
                                            <button
                                                key={s.name}
                                                type="button"
                                                onClick={s.action}
                                                className="w-full flex items-center gap-3 p-2.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg text-sm text-dark-100 transition-all hover:border-primary-500/50 group text-left"
                                            >
                                                <span className="text-primary-400">{s.icon}</span>
                                                <span className="group-hover:text-primary-400 transition-colors">{s.name}</span>
                                            </button>
                                        ) : (
                                            <Link
                                                key={s.name}
                                                href={s.path || '/'}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 p-2.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg text-sm text-dark-100 transition-all hover:border-primary-500/50 group"
                                            >
                                                <span className="text-primary-400">{s.icon}</span>
                                                <span className="group-hover:text-primary-400 transition-colors">{s.name}</span>
                                            </Link>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 border-t border-dark-800 bg-dark-950/50">
                        <p className="text-[10px] text-dark-500 text-center uppercase tracking-widest font-medium">
                            CloudMart AI 2.0
                        </p>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 ${isOpen
                        ? 'bg-primary-600 border-primary-400 text-white rotate-90'
                        : 'bg-primary-500 border-primary-400/50 text-white'
                    }`}
                aria-label="Toggle Support Chatbot"
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-dark-950 rounded-full animate-pulse"></span>
            </button>
        </div>
    );
}
