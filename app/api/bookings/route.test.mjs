import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { beforeEach, mock, test } from "node:test"

// Resolve the application's TypeScript aliases without starting a server or opening a database.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(
        new URL(`../../../${specifier.slice(2)}.ts`, import.meta.url).href,
        context
      )
    }
    if (specifier === "next/server")
      return nextResolve("next/server.js", context)
    return nextResolve(specifier, context)
  },
})

let content
let callbacks
let messages
let events
let saveError
let mailError

mock.module("next/server.js", {
  namedExports: { after: (callback) => callbacks.push(callback) },
})
mock.module(new URL("../../../lib/cms-store.ts", import.meta.url).href, {
  namedExports: {
    readCmsContent: async () => structuredClone(content),
    updateCmsContent: async (update) => {
      if (saveError) throw saveError
      content = update(content)
      return content
    },
  },
})
mock.module(new URL("../../../lib/mailer.ts", import.meta.url).href, {
  namedExports: {
    sendMail: async (message) => {
      if (mailError) throw mailError
      messages.push(message)
    },
  },
})
mock.module(new URL("../../../lib/server-log.ts", import.meta.url).href, {
  namedExports: {
    logServerEvent: (level, event, details) =>
      events.push({ level, event, ...details }),
    serializeServerError: (error) => ({ message: error.message }),
  },
})

const { POST } = await import("./route.ts")
const { sendFormNotification, sendPaymentOrderNotification } =
  await import("../../../lib/form-notifications.ts")
const { POST: submitForm } = await import("../forms/[type]/route.ts")

beforeEach(() => {
  callbacks = []
  messages = []
  events = []
  saveError = null
  mailError = null
  content = {
    paymentOrders: [],
    siteSettings: { logoImage: "/logo.webp" },
    notificationSettings: {
      enabled: true,
      recipientEmail: "admin@example.com",
      smtpHost: "smtp.example.com",
      smtpPort: "587",
      smtpSecure: false,
      smtpUsername: "sender@example.com",
      smtpPassword: "test-password",
      smtpFrom: "",
    },
    serviceLocations: [{ id: "la", city: "洛杉矶", country: "美国" }],
    serviceRegions: [{ name: "美国", code2: "US" }],
    bookingConfigs: [
      {
        locationId: "la",
        currency: "USD",
        items: [
          {
            id: "regular",
            type: "service",
            label: "日常清洁",
            enabled: true,
            basePrice: 100,
          },
          {
            id: "oven",
            type: "addon",
            label: "烤箱内部清洁",
            enabled: true,
            basePrice: 25,
          },
        ],
      },
    ],
  }
})

function request(patch = {}) {
  return new Request("https://0.0.0.0:3000/api/bookings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "test-booking",
    },
    body: JSON.stringify({
      customerName: "Test <Customer>",
      contact: "+1 213 555 0123",
      serviceAddress: "123 Test Street",
      serviceArea: "洛杉矶 · 美国",
      serviceDate: "2099-01-01",
      serviceTypeId: "regular",
      bedrooms: "2",
      bathrooms: "1",
      hasPets: true,
      addOnIds: ["oven"],
      addOnOther: "阳台清洁",
      note: "请提前联系",
      ...patch,
    }),
  })
}

test("saved bookings send their details to the configured recipient after the response", async () => {
  const response = await POST(request())
  const { order } = await response.json()
  assert.equal(response.status, 201)
  assert.equal(content.paymentOrders[0].orderId, order.orderId)
  assert.equal(messages.length, 0)
  assert.equal(callbacks.length, 1)
  await callbacks[0]()
  assert.equal(messages.length, 1)
  assert.equal(messages[0].to, "admin@example.com")
  assert.equal(messages[0].smtp.host, "smtp.example.com")
  assert.equal(messages[0].smtp.password, "test-password")
  assert.match(messages[0].subject, /新的立即预约/)
  for (const detail of [
    order.orderId,
    "Test <Customer>",
    "+1 213 555 0123",
    "123 Test Street",
    "2099-01-01",
    "2 卧 / 1 卫",
    "烤箱内部清洁、阳台清洁",
    "请提前联系",
  ]) {
    assert.ok(messages[0].text.includes(detail), detail)
  }
  assert.match(messages[0].html, /Test &lt;Customer&gt;/)
  assert.match(messages[0].html, /https:\/\/auntiechen.com\/logo.webp/)
  assert.ok(!messages[0].html.includes("0.0.0.0"))
  assert.ok(
    events.some(
      (event) =>
        event.event === "booking.notification.sent" &&
        event.orderId === order.orderId
    )
  )
})

test("SMTP failure is logged without losing or duplicating the saved booking", async () => {
  mailError = new Error("535 Authentication failed")
  const response = await POST(request())
  const { order } = await response.json()
  assert.equal(response.status, 201)
  await assert.doesNotReject(callbacks[0])
  assert.equal(content.paymentOrders.length, 1)
  const failure = events.find(
    (event) => event.event === "booking.notification.failed"
  )
  assert.equal(failure.orderId, order.orderId)
  assert.equal(failure.requestId, "test-booking")
  assert.match(failure.error.message, /Authentication failed/)
  assert.ok(!JSON.stringify(events).includes("test-password"))
})

test("disabled or incomplete SMTP configuration skips mail while still saving bookings", async () => {
  for (const patch of [{ enabled: false }, { smtpPassword: "" }]) {
    content.notificationSettings = {
      ...content.notificationSettings,
      enabled: true,
      ...patch,
    }
    const response = await POST(request())
    assert.equal(response.status, 201)
    await callbacks.at(-1)()
  }
  assert.equal(content.paymentOrders.length, 2)
  assert.equal(messages.length, 0)
  assert.equal(
    events.filter((event) => event.event === "booking.notification.skipped")
      .length,
    2
  )
})

test("invalid bookings and database failures never schedule an email", async () => {
  assert.equal((await POST(request({ contact: "invalid" }))).status, 400)
  saveError = new Error("Database write failed")
  assert.equal((await POST(request())).status, 500)
  assert.equal(content.paymentOrders.length, 0)
  assert.equal(callbacks.length, 0)
})

test("the switch also prevents join and payment emails", async () => {
  content.notificationSettings.enabled = false
  assert.equal(
    await sendFormNotification(content.notificationSettings, {
      formType: "join",
      fields: [["姓名", "Test"]],
      submittedAt: new Date().toISOString(),
    }),
    false
  )
  assert.equal(
    await sendPaymentOrderNotification(content.notificationSettings, {}),
    false
  )
  assert.equal(messages.length, 0)
})

test("email-only forms report disabled notifications instead of claiming the application was delivered", async () => {
  content.notificationSettings.enabled = false
  const response = await submitForm(request(), {
    params: Promise.resolve({ type: "join" }),
  })
  assert.equal(response.status, 503)
  assert.equal((await response.json()).error, "form_notifications_disabled")
  assert.equal(messages.length, 0)
})

test("booking, join, and payment notifications all include configured CC addresses", async () => {
  content.notificationSettings.ccEmails = [
    " team@example.com ",
    "TEAM@example.com",
    "owner@example.com",
  ]
  const response = await POST(request())
  const { order } = await response.json()
  await callbacks[0]()
  await sendFormNotification(content.notificationSettings, {
    formType: "join",
    fields: [["姓名", "Test"]],
    submittedAt: new Date().toISOString(),
  })
  await sendPaymentOrderNotification(content.notificationSettings, {
    ...order,
    status: "paid",
    amount: "USD 125",
  })
  assert.equal(messages.length, 3)
  for (const message of messages) {
    assert.equal(message.to, "admin@example.com")
    assert.deepEqual(message.cc, ["team@example.com", "owner@example.com"])
  }
})
