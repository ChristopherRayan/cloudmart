/** @type {import('next').NextConfig} */
const apiProxyBase = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://nginx/api';

const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['localhost'],
        unoptimized: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${apiProxyBase}/:path*`,
            },
            {
                source: '/storage/:path*',
                destination: 'http://nginx/storage/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
