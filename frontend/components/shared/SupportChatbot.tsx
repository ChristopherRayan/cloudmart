'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, X, Home, ShoppingBag, ShoppingCart, Package, User, Bot, HelpCircle } from 'lucide-react';

export default function SupportChatbot() {
    const [isOpen, setIsOpen] = useState(false);

    const shortcuts = [
        { name: 'Home', path: '/', icon: <Home size={18} /> },
        { name: 'Products', path: '/products', icon: <ShoppingBag size={18} /> },
        { name: 'My Cart', path: '/cart', icon: <ShoppingCart size={18} /> },
        { name: 'My Orders', path: '/profile', icon: <Package size={18} /> },
        { name: 'Account settings', path: '/profile', icon: <User size={18} /> },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 bg-dark-900 border border-primary-500/50 rounded-2xl shadow-2xl overflow-hidden glass translate-y-[-10px] animate-slide-up ring-1 ring-primary-500/20">
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

                    <div className="p-4 max-h-[400px] overflow-y-auto">
                        <div className="bg-dark-800 p-3 rounded-lg mb-4 border border-dark-700">
                            <p className="text-sm text-dark-100 flex items-start gap-2">
                                <span className="mt-1 text-primary-400">👋</span>
                                Hello! I'm your CloudMart guide. How can I help you today?
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
                                    <HelpCircle size={12} />
                                    How to use the app
                                </h4>
                                <ul className="text-xs text-dark-300 space-y-2 list-disc pl-4">
                                    <li>Browse products using the <strong>Products</strong> page.</li>
                                    <li>Add items into your <strong>Cart</strong>.</li>
                                    <li>Track orders in <strong>My Orders</strong> section.</li>
                                    <li>Switch <strong>Themes</strong> in the header toggle.</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2">Quick Shortcuts</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {shortcuts.map((s) => (
                                        <Link
                                            key={s.name}
                                            href={s.path}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 p-2.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg text-sm text-dark-100 transition-all hover:border-primary-500/50 group"
                                        >
                                            <span className="text-primary-400">{s.icon}</span>
                                            <span className="group-hover:text-primary-400 transition-colors">{s.name}</span>
                                        </Link>
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
