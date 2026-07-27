import crypto from "node:crypto"
import net from "node:net"
import tls from "node:tls"

type SendMailInput = {
  html: string
  smtp: SmtpConfig
  subject: string
  text: string
  to: string
}

type SmtpConfig = {
  from: string
  host: string
  password: string
  port: number
  secure: boolean
  username: string
}

type SmtpMessageInput = {
  from: string
  host: string
  message: string
  password: string
  port: number
  secure: boolean
  to: string
  username: string
}

async function sendMail({ html, smtp, subject, text, to }: SendMailInput) {
  if (!smtp.host) {
    throw serviceError(
      503,
      "smtp_not_configured",
      "SMTP is not configured. Please configure SMTP in site settings."
    )
  }

  const host = smtp.host
  const port = smtp.port || 587
  const secure = smtp.secure || port === 465
  const username = smtp.username
  const password = smtp.password
  const from = smtp.from || username

  if (!from) {
    throw serviceError(
      503,
      "smtp_from_missing",
      "SMTP sender is not configured."
    )
  }

  const boundary = `auntie-chen-${crypto.randomBytes(8).toString("hex")}`
  const message = [
    `From: ${formatEmailAddress(from)}`,
    `To: ${formatEmailAddress(to)}`,
    `Subject: ${encodeMailHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n")

  await sendSmtpMessage({
    from,
    host,
    message,
    password,
    port,
    secure,
    to,
    username,
  })
}

async function sendSmtpMessage({
  from,
  host,
  message,
  password,
  port,
  secure,
  to,
  username,
}: SmtpMessageInput) {
  let socket: net.Socket | tls.TLSSocket = secure
    ? tls.connect({ host, port, servername: host })
    : net.connect({ host, port })
  socket.setEncoding("utf8")
  socket.setTimeout(20_000)

  let buffer = ""
  const waitForResponse = () =>
    new Promise<string>((resolve, reject) => {
      function cleanup() {
        socket.off("data", handleData)
        socket.off("error", handleError)
        socket.off("timeout", handleTimeout)
      }

      function handleData(chunk: Buffer | string) {
        buffer += chunk.toString()
        const completeLine = buffer
          .split(/\r?\n/)
          .find((line) => /^\d{3} /.test(line))

        if (!completeLine) {
          return
        }

        cleanup()
        const response = buffer
        buffer = ""
        resolve(response)
      }

      function handleError(error: Error) {
        cleanup()
        reject(error)
      }

      function handleTimeout() {
        cleanup()
        reject(new Error("SMTP connection timed out."))
      }

      socket.on("data", handleData)
      socket.once("error", handleError)
      socket.once("timeout", handleTimeout)
    })

  async function command(value: string, expectedCodes: number[]) {
    if (value) {
      socket.write(`${value}\r\n`)
    }

    const response = await waitForResponse()
    const code = Number(response.slice(0, 3))

    if (!expectedCodes.includes(code)) {
      throw new Error(`SMTP command failed: ${response}`)
    }

    return response
  }

  try {
    await command("", [220])
    await command("EHLO auntiechen.local", [250])

    if (!secure) {
      await command("STARTTLS", [220])
      const secureSocket = tls.connect({ socket, servername: host })
      await new Promise<void>((resolve, reject) => {
        secureSocket.once("secureConnect", resolve)
        secureSocket.once("error", reject)
      })
      socket = secureSocket
      socket.setEncoding("utf8")
      socket.setTimeout(20_000)
      buffer = ""
      await command("EHLO auntiechen.local", [250])
    }

    if (username && password) {
      await command("AUTH LOGIN", [334])
      await command(Buffer.from(username).toString("base64"), [334])
      await command(Buffer.from(password).toString("base64"), [235])
    }

    await command(`MAIL FROM:<${extractEmailAddress(from)}>`, [250])
    await command(`RCPT TO:<${extractEmailAddress(to)}>`, [250, 251])
    await command("DATA", [354])
    await command(`${message.replace(/\r?\n\./g, "\r\n..")}\r\n.`, [250])
    await command("QUIT", [221])
  } finally {
    socket.destroy()
  }
}

function encodeMailHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
}

function formatEmailAddress(value: string) {
  return `<${extractEmailAddress(value)}>`
}

function extractEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/)
  return (match?.[1] ?? value).trim()
}

function serviceError(status: number, error: string, message: string) {
  const nextError = new Error(message) as Error & {
    error?: string
    status?: number
  }
  nextError.status = status
  nextError.error = error
  return nextError
}

export { sendMail }

export type { SmtpConfig }
