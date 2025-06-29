/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  compiler: {
    styledJsx: true
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*'],
    largePageDataBytes: 128 * 1000, // 128KB
  },
  images: {
    unoptimized: true,
    domains: ['www.mealappeal.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'www.mealappeal.app',
      },
    ],
  },
  // Webpack optimizations to prevent chunk loading errors
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Optimize chunk splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate vendor chunks for better caching
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          // Separate large libraries
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            chunks: 'all',
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'all',
          },
        },
      }
    }
    return config
  },
}

export default nextConfig
