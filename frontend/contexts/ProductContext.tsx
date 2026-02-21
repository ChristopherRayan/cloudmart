'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { apiGet } from '@/lib/api';
import { Category, ApiResponse } from '@/types';

interface ProductContextType {
    categories: Category[];
    isLoadingCategories: boolean;
    refreshCategories: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const CATEGORY_CACHE_KEY = 'product_categories';
const CATEGORY_CACHE_TS_KEY = 'product_categories_ts';
const CATEGORY_CACHE_TTL_MS = 10 * 60 * 1000;

export function ProductProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const lastFetchRef = useRef(0);
    const inFlightRequestRef = useRef<Promise<void> | null>(null);

    const fetchCategories = useCallback(async (force = false) => {
        const now = Date.now();
        const isFresh = now - lastFetchRef.current < CATEGORY_CACHE_TTL_MS;

        if (!force && categories.length > 0 && isFresh) {
            return;
        }

        if (inFlightRequestRef.current) {
            return inFlightRequestRef.current;
        }

        const requestPromise = (async () => {
            setIsLoadingCategories(true);
            try {
                const response = await apiGet<ApiResponse<Category[]>>('/categories', {
                    cacheTtlMs: CATEGORY_CACHE_TTL_MS,
                    forceRefresh: force,
                });
                setCategories(response.data.data);
                lastFetchRef.current = Date.now();

                if (typeof window !== 'undefined') {
                    localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(response.data.data));
                    localStorage.setItem(CATEGORY_CACHE_TS_KEY, String(lastFetchRef.current));
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setIsLoadingCategories(false);
                inFlightRequestRef.current = null;
            }
        })();

        inFlightRequestRef.current = requestPromise;
        return requestPromise;
    }, [categories.length]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const savedCategories = localStorage.getItem(CATEGORY_CACHE_KEY);
            const savedTimestamp = Number(localStorage.getItem(CATEGORY_CACHE_TS_KEY) || '0');

            if (savedCategories) {
                const parsed = JSON.parse(savedCategories) as Category[];
                setCategories(parsed);
                lastFetchRef.current = savedTimestamp;
            }

            const isStale = !savedCategories || Date.now() - savedTimestamp >= CATEGORY_CACHE_TTL_MS;
            if (isStale) {
                void fetchCategories(true);
            }
        } catch (e) {
            console.error('Failed to parse categories from localStorage', e);
            void fetchCategories(true);
        }
    }, [fetchCategories]);

    const refreshCategories = useCallback(async () => {
        await fetchCategories(true);
    }, [fetchCategories]);

    return (
        <ProductContext.Provider value={{
            categories,
            isLoadingCategories,
            refreshCategories
        }}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProducts() {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
}
