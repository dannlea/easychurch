/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing code ...
  experimental: {
    // ... existing experimental options ...
    staticPageGenerationTimeout: 120 // Increase timeout to 120 seconds
  }

  // ... existing code ...
}

module.exports = nextConfig
