import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/garden/:path*",
        destination: "/api/garden/:path*"
      }
    ]
  }
}

export default nextConfig