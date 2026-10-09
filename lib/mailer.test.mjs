import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import net from "node:net"
import tls from "node:tls"
import test from "node:test"

import { sendMail } from "./mailer.ts"

// Simulate a 450 ms connection: Node's default 250 ms address-attempt window
// fails before the SMTP greeting, despite the server being reachable.
class SmtpSocket extends EventEmitter {
  commands = []
  destroyed = false
  timers = []

  constructor(replies) {
    super()
    this.replies = [...replies]
  }

  connect(options) {
    const delay = 450
    const timeout = options.autoSelectFamilyAttemptTimeout ?? 250
    this.timers.push(
      setTimeout(
        () => {
          if (timeout < delay) {
            this.emit(
              "error",
              Object.assign(new AggregateError([], ""), { code: "ETIMEDOUT" })
            )
          } else {
            this.emit("data", "220 smtp.test.invalid ready\r\n")
          }
        },
        Math.min(delay, timeout)
      )
    )
    return this
  }

  setEncoding() {
    return this
  }
  setTimeout() {
    return this
  }

  write(value) {
    this.commands.push(value)
    const reply = this.replies.shift()
    assert.ok(reply, "Unexpected SMTP command")
    queueMicrotask(() => this.emit("data", `${reply}\r\n`))
    return true
  }

  destroy() {
    this.destroyed = true
    this.timers.forEach(clearTimeout)
  }
}

const mail = {
  smtp: {
    host: "smtp.test.invalid",
    port: 465,
    secure: true,
    username: "sender@example.com",
    password: "test-password",
    from: "sender@example.com",
  },
  to: "recipient@example.com",
  subject: "Test booking",
  text: "Test booking details",
  html: "<p>Test booking details</p>",
}

const deliveryReplies = [
  "250 Hello",
  "334 Username",
  "334 Password",
  "235 Authenticated",
  "250 Sender accepted",
  "250 Recipient accepted",
  "354 Send message",
  "250 Queued",
  "221 Bye",
]

test("implicit TLS SMTP completes when establishing the connection takes over 250 ms", async (t) => {
  const socket = new SmtpSocket(deliveryReplies)
  t.after(() => socket.destroy())
  t.mock.method(tls, "connect", (options) => {
    assert.equal(options.servername, mail.smtp.host)
    assert.notEqual(options.rejectUnauthorized, false)
    return socket.connect(options)
  })
  await sendMail(mail)
  assert.equal(
    socket.commands.filter((command) => command === "DATA\r\n").length,
    1
  )
  assert.equal(socket.commands.at(-1), "QUIT\r\n")
  assert.equal(socket.destroyed, true)
})

test("STARTTLS uses the same connection window and authenticates only after TLS upgrade", async (t) => {
  const plainSocket = new SmtpSocket(["250 Hello", "220 Start TLS"])
  const secureSocket = new SmtpSocket(deliveryReplies)
  t.after(() => {
    plainSocket.destroy()
    secureSocket.destroy()
  })
  t.mock.method(net, "connect", (options) => plainSocket.connect(options))
  t.mock.method(tls, "connect", (options) => {
    assert.equal(options.socket, plainSocket)
    assert.equal(options.servername, mail.smtp.host)
    queueMicrotask(() => secureSocket.emit("secureConnect"))
    return secureSocket
  })
  await sendMail({ ...mail, smtp: { ...mail.smtp, port: 587, secure: false } })
  assert.deepEqual(plainSocket.commands, [
    "EHLO auntiechen.local\r\n",
    "STARTTLS\r\n",
  ])
  assert.equal(secureSocket.commands[1], "AUTH LOGIN\r\n")
  assert.equal(
    secureSocket.commands.filter((command) => command === "DATA\r\n").length,
    1
  )
  assert.equal(secureSocket.destroyed, true)
})

test("SMTP authentication errors propagate without retrying or submitting a message", async (t) => {
  const socket = new SmtpSocket(["250 Hello", "535 Authentication failed"])
  t.after(() => socket.destroy())
  t.mock.method(tls, "connect", (options) => socket.connect(options))
  await assert.rejects(sendMail(mail), /535 Authentication failed/)
  assert.ok(!socket.commands.includes("DATA\r\n"))
  assert.equal(socket.destroyed, true)
})
