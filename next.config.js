/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing code ...
  experimental: {
    // ... existing experimental options ...
  },
  staticPageGenerationTimeout: 120 // Move timeout to root level
}

module.exports = nextConfig
