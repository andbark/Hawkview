/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['lovgkwffaebsjfejuqfp.supabase.co'],
  },
  // Safer output settings for better stability
  poweredByHeader: false,
  generateEtags: false,
  // Configure page extensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Add exception for browser extension errors
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  }
};

module.exports = nextConfig; 