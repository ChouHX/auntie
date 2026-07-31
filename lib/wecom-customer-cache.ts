import type { WecomCustomer, WecomCustomerPage } from "@/lib/wecom-types"

type CachedCustomerPage = {
  cachedAt: number
  customers: WecomCustomer[]
  pagination: WecomCustomerPage["pagination"]
}

type CustomerCacheStore = Record<string, CachedCustomerPage>

const cacheKeyPrefix = "auntie-admin-wecom-customer-picker-v1"
const cacheTtlMs = 10 * 60 * 1000

export function readCachedWecomCustomers(token: string, query: string) {
  const store = readStore(token)
  const key = normalizeQuery(query)
  const cached = store[key]
  if (!cached) return null

  if (
    !isCachedCustomerPage(cached) ||
    Date.now() - cached.cachedAt > cacheTtlMs
  ) {
    delete store[key]
    writeStore(token, store)
    return null
  }

  return cached
}

export function cacheWecomCustomers(
  token: string,
  query: string,
  customers: WecomCustomer[],
  pagination: WecomCustomerPage["pagination"]
) {
  const store = readStore(token)
  store[normalizeQuery(query)] = {
    cachedAt: Date.now(),
    customers,
    pagination,
  }
  writeStore(token, store)
}

export function clearCachedWecomCustomers(token: string) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(getStorageKey(token))
  } catch {
    // Customer caching is optional and must not block admin workflows.
  }
}

function readStore(token: string): CustomerCacheStore {
  if (typeof window === "undefined") return {}
  try {
    const value = JSON.parse(
      window.sessionStorage.getItem(getStorageKey(token)) ?? "{}"
    ) as unknown
    return value && typeof value === "object"
      ? (value as CustomerCacheStore)
      : {}
  } catch {
    return {}
  }
}

function writeStore(token: string, store: CustomerCacheStore) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(getStorageKey(token), JSON.stringify(store))
  } catch {
    // Browsers may disable or limit session storage; fall back to API loading.
  }
}

function normalizeQuery(query: string) {
  return query.trim().toLocaleLowerCase()
}

function getStorageKey(token: string) {
  let hash = 5381
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 33) ^ token.charCodeAt(index)
  }
  return `${cacheKeyPrefix}:${hash >>> 0}`
}

function isCachedCustomerPage(value: unknown): value is CachedCustomerPage {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<CachedCustomerPage>
  return (
    typeof candidate.cachedAt === "number" &&
    Array.isArray(candidate.customers) &&
    Boolean(candidate.pagination) &&
    typeof candidate.pagination?.page === "number" &&
    typeof candidate.pagination?.pageSize === "number" &&
    typeof candidate.pagination?.totalCount === "number" &&
    typeof candidate.pagination?.totalPages === "number"
  )
}
