import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto"

import { readCmsContent, updateCmsContent } from "@/lib/cms-store"

const sessionSecret =
  process.env.SALES_SESSION_SECRET ??
  process.env.ADMIN_SESSION_TOKEN ??
  "local-admin-token"
const sessionMaxAge = 60 * 60 * 12
const salesSessionCookie = "sales_session"

type SalesSession = {
  expiresAt: number
  salesMemberId: string
  version: number
}

function hashSalesPassword(password: string, salt: string) {
  const digest = scryptSync(password, salt, 64).toString("hex")
  return `scrypt$${salt}$${digest}`
}

function verifySalesPassword(password: string, encodedHash = "") {
  const [algorithm, salt, expectedHex] = encodedHash.split("$")
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false
  const expected = Buffer.from(expectedHex, "hex")
  const actual = scryptSync(password, salt, expected.length || 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function createSalesSessionToken(salesMemberId: string, version: number) {
  const session: SalesSession = {
    expiresAt: Math.floor(Date.now() / 1000) + sessionMaxAge,
    salesMemberId,
    version,
  }
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url")
  return `${payload}.${sign(payload)}`
}

async function authenticateSalesMember(username: string, password: string) {
  const normalizedUsername = username.trim().toLocaleLowerCase()
  const member = (await readCmsContent()).salesMembers.find(
    (item) =>
      item.status === "active" &&
      item.accountUsername?.toLocaleLowerCase() === normalizedUsername
  )
  if (!member || !verifySalesPassword(password, member.passwordHash))
    return null
  return {
    member,
    token: createSalesSessionToken(member.id, member.authVersion ?? 1),
  }
}

async function getSalesMemberFromToken(token?: string | null) {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature || !safeEqual(signature, sign(payload)))
    return null
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as SalesSession
    if (session.expiresAt <= Math.floor(Date.now() / 1000)) return null
    const member = (await readCmsContent()).salesMembers.find(
      (item) => item.id === session.salesMemberId
    )
    if (
      !member ||
      member.status !== "active" ||
      (member.authVersion ?? 1) !== session.version
    ) {
      return null
    }
    return member
  } catch {
    return null
  }
}

async function changeSalesPassword(
  salesMemberId: string,
  currentPassword: string,
  newPassword: string
) {
  let changed = false
  let nextVersion = 0
  await updateCmsContent((content) => {
    const member = content.salesMembers.find(
      (item) => item.id === salesMemberId && item.status === "active"
    )
    if (!member || !verifySalesPassword(currentPassword, member.passwordHash)) {
      return content
    }
    changed = true
    nextVersion = (member.authVersion ?? 1) + 1
    return {
      ...content,
      salesMembers: content.salesMembers.map((item) =>
        item.id === salesMemberId
          ? {
              ...item,
              authVersion: nextVersion,
              passwordHash: hashSalesPassword(
                newPassword,
                randomBytes(16).toString("hex")
              ),
              updatedAt: new Date().toISOString(),
            }
          : item
      ),
    }
  })
  return changed ? createSalesSessionToken(salesMemberId, nextVersion) : null
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url")
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export {
  authenticateSalesMember,
  changeSalesPassword,
  getSalesMemberFromToken,
  hashSalesPassword,
  salesSessionCookie,
  sessionMaxAge,
}
