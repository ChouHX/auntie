import type { NextRequest } from "next/server"

import { getAirwallexConfig, isAirwallexConfigured } from "@/lib/airwallex"
import { isAdminToken } from "@/lib/cms-store"

export const runtime = "nodejs"

function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  return isAdminToken(token ?? null)
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Admin authentication is required.",
      },
      { status: 401 }
    )
  }

  const config = getAirwallexConfig()
  const origin = new URL(request.url).origin
  const webhookSecretSource = process.env.AIRWALLEX_WEBHOOK_SECRET?.trim()
    ? "env"
    : "missing"

  return Response.json({
    airwallex: {
      accountIdConfigured: Boolean(config.accountId),
      apiBaseUrl: config.apiBaseUrl,
      apiKeyConfigured: Boolean(config.apiKey),
      clientIdConfigured: Boolean(config.clientId),
      configured: isAirwallexConfigured(),
      environment: config.environment,
      environmentConfigured: Boolean(process.env.AIRWALLEX_ENV?.trim()),
      webhookSecretConfigured: Boolean(config.webhookSecret),
      webhookSecretSource,
      webhookUrl: `${origin}/api/airwallex/webhook`,
    },
  })
}
