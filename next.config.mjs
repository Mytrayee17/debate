/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 4
  },
  images: {
    unoptimized: true
  }
}

export default nextConfig