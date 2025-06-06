/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double mounting
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    domains: [
      'via.placeholder.com', // For placeholder images
      'supabase.co', // Current Supabase domain
      'localhost', // For local development
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // All Supabase subdomains
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
