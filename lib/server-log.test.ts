import assert from "node:assert/strict"
import test from "node:test"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const { serializeServerError } = await import("./server-log.ts")

test("connection failures include each attempted IP and a nonempty summary", () => {
  const ipv4 = Object.assign(new Error("connect ETIMEDOUT 192.0.2.1:465"), {
    address: "192.0.2.1",
    port: 465,
    code: "ETIMEDOUT",
    syscall: "connect",
  })
  const ipv6 = Object.assign(new Error("connect ENETUNREACH 2001:db8::1:465"), {
    address: "2001:db8::1",
    port: 465,
    code: "ENETUNREACH",
    syscall: "connect",
  })
  const error = Object.assign(new AggregateError([ipv4, ipv6], ""), {
    code: "ETIMEDOUT",
    password: "must-not-be-logged",
  })
  const result = serializeServerError(error)
  assert.equal(result.message, "AggregateError: ETIMEDOUT")
  assert.equal(result.errors?.length, 2)
  assert.equal(result.errors?.[0].address, "192.0.2.1")
  assert.equal(result.errors?.[0].port, 465)
  assert.equal(result.errors?.[1].code, "ENETUNREACH")
  assert.ok(!JSON.stringify(result).includes("must-not-be-logged"))
})

test("recursive aggregate errors cannot cause unbounded log serialization", () => {
  const error = new AggregateError([], "nested")
  error.errors.push(error)
  const result = serializeServerError(error)
  assert.doesNotThrow(() => JSON.stringify(result))
  assert.equal(result.errors?.[0].errors?.[0].errors?.[0].errors, undefined)
})

test("ordinary errors and non-error throws still have useful messages", () => {
  assert.equal(
    serializeServerError(new Error("535 Authentication failed")).message,
    "535 Authentication failed"
  )
  assert.equal(
    serializeServerError("connection failed").message,
    "connection failed"
  )
})
