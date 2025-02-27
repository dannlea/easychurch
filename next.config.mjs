/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use base path if configured in environment variable
  basePath: process.env.BASEPATH,

  // Enable image optimization and configure domains for remote images
  images: {
    domains: [
      'localhost',
      'easychurch.onrender.com',
      new URL(process.env.NEXT_PUBLIC_LOCAL_SERVER || 'http://localhost:3001').hostname
    ],

    // Optimize image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Production optimizations
  swcMinify: true,

  // Handle trailing slashes consistently
  trailingSlash: false,

  // Improve build output
  output: 'standalone',

  // Control powered by header
  poweredByHeader: false,

  // Enable React strict mode for better development
  reactStrictMode: true
}

export default nextConfig
