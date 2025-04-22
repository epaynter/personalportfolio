/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure webpack for better error handling
  webpack: (config, { isServer }) => {
    // Add any webpack customizations here if needed
    return config;
  },
  // Add proper error handling
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Fix for PORT environment variable
  env: {
    PORT: process.env.PORT ? String(process.env.PORT) : '3000',
  },
}

module.exports = nextConfig;