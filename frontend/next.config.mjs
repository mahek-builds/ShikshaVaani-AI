/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://shikshavaani-ai-ym58.onrender.com',
  },
};

export default nextConfig;
