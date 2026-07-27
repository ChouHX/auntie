import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.local",
    "10.*.*.*",
    "172.*.*.*",
    "192.168.*.*",
  ],
  output: "standalone",
}

export default nextConfig
