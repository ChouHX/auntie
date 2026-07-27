import type { NextConfig } from "next"

const defaultAllowedDevOrigins = [
  "10.*.*.*",
  "172.*.*.*",
  "192.168.*.*",
  "*.lan",
  "*.local",
  "*.loca.lt",
  "*.ngrok-free.app",
  "*.ngrok.app",
  "*.trycloudflare.com",
]

function getAllowedDevOrigins() {
  const extraOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  return Array.from(new Set([...defaultAllowedDevOrigins, ...extraOrigins]))
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  output: "standalone",
}

export default nextConfig
