'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!agreedToTerms) {
            toast.error('You must agree to the Terms of Service and Privacy Policy');
            return;
        }

        setLoading(true);
        try {
            await register(
                formData.name,
                formData.email,
                formData.phone,
                formData.password,
                formData.confirmPassword
            );
            toast.success('Account created successfully!');
            router.push('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registration failed');
            // Show validation errors if available
            if (err.response?.data?.errors) {
                Object.values(err.response.data.errors).flat().forEach((msg: any) => toast.error(msg));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-dark-950 z-0" />

            <div className="w-full max-w-md card z-10 animate-fade-in relative">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center mx-auto">
                            <span className="text-white font-bold text-2xl">C</span>
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-dark-100">Create Account</h1>
                    <p className="text-dark-400 mt-2">Join Cloudimart today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="john@mzuni.ac.mw"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="e.g. 0999123456"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label className="label">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex items-start space-x-3 bg-dark-900/50 p-3 rounded-lg border border-dark-700/50 mt-2">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="h-4 w-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500 bg-dark-800"
                                required
                            />
                        </div>
                        <div className="text-xs">
                            <label htmlFor="terms" className="text-dark-300">
                                I agree to the <span className="text-primary-400 font-semibold underline cursor-pointer">Terms of Service</span> and <span className="text-primary-400 font-semibold underline cursor-pointer">Privacy Policy</span>.
                            </label>
                            <p className="text-dark-500 mt-1 leading-relaxed">
                                By joining, you acknowledge that Cloudimart is a campus-focused service for Mzuzu University. You agree to provide accurate delivery information and understand that service is restricted to University geofenced areas.
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !agreedToTerms}
                        className={`w-full btn-primary flex justify-center items-center mt-6 ${(!agreedToTerms || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-dark-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
