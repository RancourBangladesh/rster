/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"]
    },
    turbo: {
      root: '.'
    }
  }
};
export default nextConfig;