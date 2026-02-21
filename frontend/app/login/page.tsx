'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const getRedirectPathByRole = useCallback((role?: string) => {
        if (role === 'admin') return '/admin';
        if (role === 'delivery_staff') return '/delivery/dashboard';
        return '/';
    }, []);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated || !user) return;

        router.replace(getRedirectPathByRole(user.role));
        router.refresh();
    }, [getRedirectPathByRole, isAuthenticated, isLoading, router, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const loggedInUser = await login(email, password);
            toast.success('Welcome back!');

            router.replace(getRedirectPathByRole(loggedInUser?.role));
            router.refresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-dark-950 z-0" />

            <div className="w-full max-w-md card z-10 animate-fade-in relative">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center mx-auto">
                            <span className="text-white font-bold text-2xl">C</span>
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-dark-100">Welcome Back</h1>
                    <p className="text-dark-400 mt-2">Sign in to continue to Cloudimart</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="label">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="you@mzuni.ac.mw"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-dark-400">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
