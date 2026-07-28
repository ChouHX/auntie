type ServerLogDetails = Record<string, unknown>
type ServerLogLevel = "error" | "info" | "warn"

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

function serializeServerError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) }
  }

  const systemError = error as Error & { code?: unknown; syscall?: unknown }

  return {
    code: typeof systemError.code === "string" ? systemError.code : undefined,
    message: error.message,
    name: error.name,
    stack: error.stack,
    syscall:
      typeof systemError.syscall === "string" ? systemError.syscall : undefined,
  }
}

export { logServerEvent, serializeServerError }
