import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/garden/:project",
        destination: "/api/garden/:project"
      },
      {
        source: "/garden/:project/",
        destination: "/api/garden/:project"
      }
    ]
  }
}

export default nextConfig