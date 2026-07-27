import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

import type { CmsContent, CmsPaymentOrder } from "@/types/cms"

type AirwallexEnvironment = "demo" | "production"

type AirwallexConfig = {
  accountId: string
  apiBaseUrl: string
  apiKey: string
  clientId: string
  environment: AirwallexEnvironment
  webhookSecret: string
}

type AirwallexPaymentLinkResponse = {
  active?: boolean
  amount?: number
  currency?: string
  id?: string
  latest_successful_payment_intent_id?: string
  metadata?: Record<string, string>
  reference?: string
  status?: string
  successful_payment_intent_count?: number
  url?: string
}

type AirwallexPaymentIntentResponse = {
  amount?: number
  client_secret?: string
  currency?: string
  id?: string
  merchant_order_id?: string
  metadata?: Record<string, string>
  payment_link?: string | { id?: string }
  payment_link_id?: string
  status?: string
}

type AirwallexTokenResponse = {
  expires_at?: string
  token?: string
}

type CachedToken = {
  expiresAtMs: number
  token: string
}

class AirwallexServiceError extends Error {
  code: string
  details?: unknown
  status: number

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message)
    this.name = "AirwallexServiceError"
    this.code = code
    this.details = details
    this.status = status
  }
}

const tokenCache = new Map<string, CachedToken>()

function getAirwallexConfig(): AirwallexConfig {
  const environment = getAirwallexEnvironment()
  const apiBaseUrl =
    process.env.AIRWALLEX_API_BASE_URL?.trim() ||
    (environment === "production"
      ? "https://api.airwallex.com"
      : "https://api-demo.airwallex.com")

  return {
    accountId: process.env.AIRWALLEX_ACCOUNT_ID?.trim() ?? "",
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
    apiKey: process.env.AIRWALLEX_API_KEY?.trim() ?? "",
    clientId: process.env.AIRWALLEX_CLIENT_ID?.trim() ?? "",
    environment,
    webhookSecret: process.env.AIRWALLEX_WEBHOOK_SECRET?.trim() ?? "",
  }
}

function getAirwallexEnvironment(): AirwallexEnvironment {
  const value = process.env.AIRWALLEX_ENV?.trim().toLowerCase()

  if (value === "production" || value === "prod" || value === "live") {
    return "production"
  }

  if (value === "demo" || value === "sandbox" || value === "test") {
    return "demo"
  }

  return "demo"
}

function isAirwallexConfigured() {
  const config = getAirwallexConfig()

  return Boolean(config.clientId && config.apiKey)
}

async function createAirwallexPaymentLink({
  content,
  order,
}: {
  content: CmsContent
  order: CmsPaymentOrder
}): Promise<AirwallexPaymentLinkResponse> {
  const config = getAirwallexConfig()
  assertAirwallexCredentials(config)

  const amount = parsePaymentAmountValue(order.amountValue, order.amount)
  const currency = normalizePaymentCurrency(
    order.currency || content.paymentSettings.currency
  )

  if (amount <= 0) {
    throw new AirwallexServiceError(
      400,
      "invalid_payment_amount",
      "Payment amount must be greater than zero."
    )
  }

  const response = await airwallexFetch<AirwallexPaymentLinkResponse>(
    config,
    "/api/v1/pa/payment_links/create",
    {
      amount: roundPaymentAmount(amount),
      collectable_shopper_info: {
        message: false,
        phone_number: true,
        reference: false,
        shipping_address: false,
      },
      currency,
      description: createPaymentLinkDescription(order),
      metadata: createPaymentLinkMetadata(order),
      reference: order.orderId,
      reusable: false,
      title: `Auntie Chen Order ${order.orderId}`,
    }
  )

  if (!response.url) {
    throw new AirwallexServiceError(
      502,
      "payment_link_url_missing",
      "Airwallex did not return a checkout URL.",
      response
    )
  }

  return response
}

async function createAirwallexPaymentIntent({
  content,
  order,
  returnUrl,
}: {
  content: CmsContent
  order: CmsPaymentOrder
  returnUrl: string
}): Promise<AirwallexPaymentIntentResponse> {
  const config = getAirwallexConfig()
  assertAirwallexCredentials(config)

  const amount = parsePaymentAmountValue(order.amountValue, order.amount)
  const currency = normalizePaymentCurrency(
    order.currency || content.paymentSettings.currency
  )

  if (amount <= 0) {
    throw new AirwallexServiceError(
      400,
      "invalid_payment_amount",
      "Payment amount must be greater than zero."
    )
  }

  const response = await airwallexFetch<AirwallexPaymentIntentResponse>(
    config,
    "/api/v1/pa/payment_intents/create",
    {
      amount: roundPaymentAmount(amount),
      currency,
      description: createPaymentLinkDescription(order),
      merchant_order_id: order.orderId,
      metadata: createPaymentLinkMetadata(order),
      request_id: createPaymentRequestId(order.orderId),
      return_url: returnUrl,
    }
  )

  if (!response.id || !response.client_secret) {
    throw new AirwallexServiceError(
      502,
      "payment_intent_incomplete",
      "Airwallex did not return a complete PaymentIntent.",
      response
    )
  }

  return response
}

async function retrieveAirwallexPaymentLink(paymentLinkId: string) {
  const config = getAirwallexConfig()
  assertAirwallexCredentials(config)

  return airwallexFetch<AirwallexPaymentLinkResponse>(
    config,
    `/api/v1/pa/payment_links/${encodeURIComponent(paymentLinkId)}`,
    undefined,
    "GET"
  )
}

async function retrieveAirwallexPaymentIntent(paymentIntentId: string) {
  const config = getAirwallexConfig()
  assertAirwallexCredentials(config)

  return airwallexFetch<AirwallexPaymentIntentResponse>(
    config,
    `/api/v1/pa/payment_intents/${encodeURIComponent(paymentIntentId)}`,
    undefined,
    "GET"
  )
}

async function airwallexFetch<TResponse>(
  config: AirwallexConfig,
  path: string,
  body: unknown | undefined,
  method: "GET" | "POST" = "POST"
): Promise<TResponse> {
  const token = await getAirwallexAccessToken(config)
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    method,
  })
  const text = await response.text()
  const data = parseJsonBody(text)

  if (!response.ok) {
    const message =
      getNestedString(data, "message") ||
      getNestedString(data, "error") ||
      "Airwallex request failed."

    throw new AirwallexServiceError(
      response.status,
      getNestedString(data, "code") || "airwallex_request_failed",
      message,
      data
    )
  }

  return data as TResponse
}

async function getAirwallexAccessToken(config: AirwallexConfig) {
  const cacheKey = [
    config.environment,
    config.apiBaseUrl,
    config.clientId,
    config.accountId,
  ].join("|")
  const cached = tokenCache.get(cacheKey)

  if (cached && cached.expiresAtMs > Date.now() + 60_000) {
    return cached.token
  }

  const response = await fetch(
    `${config.apiBaseUrl}/api/v1/authentication/login`,
    {
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        "x-client-id": config.clientId,
        ...(config.accountId ? { "x-login-as": config.accountId } : {}),
      },
      method: "POST",
    }
  )
  const text = await response.text()
  const data = parseJsonBody(text) as AirwallexTokenResponse

  if (!response.ok || !data.token) {
    throw new AirwallexServiceError(
      response.status || 502,
      "airwallex_auth_failed",
      "Airwallex authentication failed.",
      data || text
    )
  }

  tokenCache.set(cacheKey, {
    expiresAtMs: parseAirwallexExpiry(data.expires_at),
    token: data.token,
  })

  return data.token
}

function assertAirwallexCredentials(config: AirwallexConfig) {
  if (config.clientId && config.apiKey) {
    return
  }

  throw new AirwallexServiceError(
    503,
    "airwallex_not_configured",
    "Airwallex credentials are not configured."
  )
}

function verifyAirwallexWebhookSignature({
  rawBody,
  secret,
  signature,
  timestamp,
}: {
  rawBody: string
  secret: string
  signature: string
  timestamp: string
}) {
  if (!rawBody || !secret || !signature || !timestamp) {
    return false
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}${rawBody}`)
    .digest("hex")
  const expectedBuffer = Buffer.from(expected, "utf8")
  const signatureBuffer = Buffer.from(signature, "utf8")

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  )
}

function parsePaymentAmountValue(value: unknown, fallback = "") {
  const numericValue = Number(value)

  if (Number.isFinite(numericValue) && numericValue >= 0) {
    return numericValue
  }

  const amount = Number(
    fallback.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0
  )

  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

function normalizePaymentCurrency(value: string | undefined) {
  const currency = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")

  return currency || "USD"
}

function createPaymentRequestId(orderId: string) {
  return `${orderId}-${randomUUID()}`.slice(0, 64)
}

function parseJsonBody(value: string) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function parseAirwallexExpiry(value: string | undefined) {
  const parsed = value ? Date.parse(value) : Number.NaN

  return Number.isFinite(parsed) ? parsed : Date.now() + 25 * 60_000
}

function roundPaymentAmount(value: number) {
  return Number(value.toFixed(2))
}

function createPaymentLinkDescription(order: CmsPaymentOrder) {
  return [order.serviceType, order.serviceDate, order.serviceArea]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 500)
}

function createPaymentLinkMetadata(order: CmsPaymentOrder) {
  return {
    customerName: order.customerName.slice(0, 120),
    orderId: order.orderId,
    serviceDate: order.serviceDate.slice(0, 120),
    serviceType: order.serviceType.slice(0, 120),
    source: "auntie-chen-web",
  }
}

function getNestedString(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>
  const directValue = record[key]

  if (typeof directValue === "string") {
    return directValue
  }

  return ""
}

export {
  AirwallexServiceError,
  createAirwallexPaymentIntent,
  createAirwallexPaymentLink,
  createPaymentRequestId,
  getAirwallexConfig,
  isAirwallexConfigured,
  normalizePaymentCurrency,
  parsePaymentAmountValue,
  retrieveAirwallexPaymentIntent,
  retrieveAirwallexPaymentLink,
  verifyAirwallexWebhookSignature,
}

export type { AirwallexPaymentIntentResponse, AirwallexPaymentLinkResponse }
