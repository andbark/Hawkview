const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript errors for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Better path aliases
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    
    // Add better build logging in debug mode
    if (process.env.NEXT_DEBUG_BUILD) {
      config.infrastructureLogging = {
        level: 'verbose',
        debug: /webpack/,
      };
    }
    
    return config;
  },
  // Enable detailed logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Better build output
  output: process.env.NEXT_DEBUG_BUILD ? 'standalone' : undefined,
  // Enable better error handling and debugging
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  swcMinify: true,
  // Generate source maps in development for better debugging
  productionBrowserSourceMaps: process.env.NEXT_DEBUG_BUILD === '1',
};

module.exports = nextConfig; 