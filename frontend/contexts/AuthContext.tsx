'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api, { apiGet } from '@/lib/api';
import { User, ApiResponse } from '@/types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<User>;
    register: (name: string, email: string, phone: string, password: string, passwordConfirmation: string) => Promise<User>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasRole: (role: string) => boolean;
    refreshUser: () => Promise<void>;
    updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeStorageUrl(url: string | null | undefined, defaultDirectory?: string): string | undefined {
    if (!url) return undefined;

    const trimmed = url.trim();
    if (!trimmed) return undefined;

    if (trimmed.startsWith('data:')) {
        return trimmed;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
            const parsed = new URL(trimmed);
            if (parsed.pathname.startsWith('/storage/')) {
                return parsed.pathname;
            }
            return trimmed;
        } catch {
            return undefined;
        }
    }

    if (trimmed.startsWith('/storage/')) return trimmed;
    if (trimmed.startsWith('storage/')) return `/${trimmed}`;

    if (trimmed.includes('/')) {
        return `/storage/${trimmed.replace(/^\/+/, '')}`;
    }

    if (defaultDirectory) {
        return `/storage/${defaultDirectory}/${trimmed.replace(/^\/+/, '')}`;
    }

    return undefined;
}

function normalizeUserPayload(userData: User): User {
    const normalizedImageUrl =
        normalizeStorageUrl(userData.profile_image_url, 'profile_images') ??
        normalizeStorageUrl(userData.profile_image, 'profile_images');

    return {
        ...userData,
        profile_image_url: normalizedImageUrl,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = normalizeUserPayload(JSON.parse(storedUser));
                setToken(storedToken);
                setUser(parsedUser);
                localStorage.setItem('user', JSON.stringify(parsedUser));
            } catch (e) {
                console.error('Failed to parse stored user', e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await api.post<ApiResponse<{ user: User; token: string }>>('/login', { email, password });

        const { user: rawUserData, token: authToken } = response.data.data;
        const userData = normalizeUserPayload(rawUserData);

        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
    }, []);

    const register = useCallback(async (name: string, email: string, phone: string, password: string, passwordConfirmation: string) => {
        const response = await api.post<ApiResponse<{ user: User; token: string }>>('/register', {
            name,
            email,
            phone,
            password,
            password_confirmation: passwordConfirmation,
        });

        const { user: rawUserData, token: authToken } = response.data.data;
        const userData = normalizeUserPayload(rawUserData);

        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch {
            // Ignore error
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    const hasRole = useCallback((role: string) => {
        return user?.role === role;
    }, [user]);

    const refreshUser = useCallback(async () => {
        try {
            const response = await apiGet<ApiResponse<User>>('/user');
            const userData = normalizeUserPayload(response.data.data);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
            console.error('Failed to refresh user data', error);
        }
    }, []);

    const updateUser = useCallback((userData: User) => {
        const normalized = normalizeUserPayload(userData);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                register,
                logout,
                isAuthenticated: !!token,
                isLoading,
                hasRole,
                refreshUser,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
