/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double mounting
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    domains: ['supabase.co'],
  },
}

export default nextConfig
