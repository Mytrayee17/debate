/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: [],
  },
  // Enable React Strict Mode
  reactStrictMode: true,
  // Enable SWC minification
  swcMinify: true,
  // Add webpack configuration
  webpack: (config, { isServer }) => {
    // Important: return the modified config
    if (!isServer) {
      // Don't include certain dependencies in the client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Add output configuration for static export
  output: 'standalone',
  // Enable production browser source maps
  productionBrowserSourceMaps: false,
  // Disable the default static optimization
  // to prevent issues with dynamic routes
  output: 'export',
  trailingSlash: true,
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mjs'],
  // Add experimental features if needed
  experimental: {
    // Enable concurrent features
    workerThreads: false,
    cpus: 4,
    // Enable modern JS features
    modern: true,
    // Enable CSS optimization
    optimizeCss: true,
    // Enable SWC minification
    swcMinify: true,
  },
  // Configure headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;