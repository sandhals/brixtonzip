import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "/:path*/index.html"
      }
    ]
  }
}

export default nextConfig