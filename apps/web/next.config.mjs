/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@backflow/financial-engine', '@backflow/types', '@backflow/validation'],
  reactStrictMode: true,
};

export default nextConfig;
