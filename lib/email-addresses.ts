export function isEmailAddress(value: string) {
  return /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value)
}

export function uniqueEmailAddresses(values: readonly string[]) {
  const seen = new Set<string>()
  return values
    .map((value) => value.trim())
    .filter((value) => {
      const key = value.toLowerCase()
      if (!value || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function splitEmailAddresses(value: string) {
  return uniqueEmailAddresses(value.split(/[\s,;，；]+/))
}
