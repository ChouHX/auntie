type ServerLogDetails = Record<string, unknown>
type ServerLogLevel = "error" | "info" | "warn"
type SerializedServerError = {
  address?: string
  code?: string
  errors?: SerializedServerError[]
  message: string
  name?: string
  port?: number
  stack?: string
  syscall?: string
}

function logServerEvent(
  level: ServerLogLevel,
  event: string,
  details: ServerLogDetails = {}
) {
  console[level](
    JSON.stringify({
      ...details,
      event,
      timestamp: new Date().toISOString(),
    })
  )
}

function serializeServerError(
  error: unknown,
  depth = 0
): SerializedServerError {
  if (!(error instanceof Error)) {
    return { message: String(error) }
  }

  const systemError = error as Error & {
    address?: unknown
    code?: unknown
    port?: unknown
    syscall?: unknown
  }
  const code =
    typeof systemError.code === "string" ? systemError.code : undefined

  return {
    address:
      typeof systemError.address === "string" ? systemError.address : undefined,
    code,
    errors:
      error instanceof AggregateError && depth < 3
        ? error.errors
            .slice(0, 8)
            .map((item) => serializeServerError(item, depth + 1))
        : undefined,
    message: error.message || [error.name, code].filter(Boolean).join(": "),
    name: error.name,
    port: typeof systemError.port === "number" ? systemError.port : undefined,
    stack: error.stack,
    syscall:
      typeof systemError.syscall === "string" ? systemError.syscall : undefined,
  }
}

export { logServerEvent, serializeServerError }
