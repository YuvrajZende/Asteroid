/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker — produces a self-contained server.js
  // with only the necessary dependencies vendored in (~150MB vs ~1GB).
  output: 'standalone',
};

export default nextConfig;
