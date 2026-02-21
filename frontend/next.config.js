/** @type {import('next').NextConfig} */
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
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'}/:path*`,
            },
            {
                source: '/storage/:path*',
                destination: 'http://nginx/storage/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
