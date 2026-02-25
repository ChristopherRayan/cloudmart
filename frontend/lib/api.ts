import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const CLIENT_API_BASE_URL = '/api';
const SERVER_API_BASE_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://nginx/api';

const api = axios.create({
    baseURL: typeof window === 'undefined' ? SERVER_API_BASE_URL : CLIENT_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

interface ApiGetOptions extends AxiosRequestConfig {
    cacheTtlMs?: number;
    forceRefresh?: boolean;
}

interface CachedResponse {
    expiresAt: number;
    response: AxiosResponse;
}

const inFlightGetRequests = new Map<string, Promise<AxiosResponse>>();
const getResponseCache = new Map<string, CachedResponse>();

function stableStringify(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (value instanceof URLSearchParams) {
        return value.toString();
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`;
    }

    if (typeof value === 'object') {
        return `{${Object.entries(value as Record<string, unknown>)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, nestedValue]) => `${key}:${stableStringify(nestedValue)}`)
            .join(',')}}`;
    }

    return String(value);
}

function buildGetRequestKey(url: string, config?: AxiosRequestConfig): string {
    const baseUrl = config?.baseURL || api.defaults.baseURL || '';
    const paramsKey = stableStringify(config?.params);
    return `${baseUrl}|${url}|${paramsKey}`;
}

function cloneAxiosResponse<T>(response: AxiosResponse<T>): AxiosResponse<T> {
    return {
        ...response,
        headers: { ...response.headers },
        config: { ...response.config },
    };
}

function clearExpiredGetCache(): void {
    const now = Date.now();
    for (const [key, entry] of getResponseCache.entries()) {
        if (entry.expiresAt <= now) {
            getResponseCache.delete(key);
        }
    }
}

export function clearApiGetCache(): void {
    getResponseCache.clear();
}

export async function apiGet<T = unknown>(url: string, config: ApiGetOptions = {}): Promise<AxiosResponse<T>> {
    clearExpiredGetCache();

    const { cacheTtlMs = 0, forceRefresh = false, ...requestConfig } = config;
    const requestKey = buildGetRequestKey(url, requestConfig);

    if (!forceRefresh && cacheTtlMs > 0) {
        const cached = getResponseCache.get(requestKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cloneAxiosResponse(cached.response as AxiosResponse<T>);
        }
    }

    if (!forceRefresh) {
        const inFlight = inFlightGetRequests.get(requestKey);
        if (inFlight) {
            return inFlight as Promise<AxiosResponse<T>>;
        }
    }

    const requestPromise = api.get<T>(url, requestConfig).then((response) => {
        if (cacheTtlMs > 0) {
            getResponseCache.set(requestKey, {
                expiresAt: Date.now() + cacheTtlMs,
                response: cloneAxiosResponse(response),
            });
        }
        return response;
    }).finally(() => {
        inFlightGetRequests.delete(requestKey);
    });

    inFlightGetRequests.set(requestKey, requestPromise as Promise<AxiosResponse>);
    return requestPromise;
}

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        const method = response.config.method?.toLowerCase();
        if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
            clearApiGetCache();
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            inFlightGetRequests.clear();
            clearApiGetCache();

            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Only redirect if not already on auth page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
