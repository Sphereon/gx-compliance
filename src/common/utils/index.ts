export function hasExpectedValues(object: any, expected: any): boolean {
  if (typeof object !== 'object') return false
  let hasValues = true
  for (const key in expected) {
    if (typeof expected[key] === 'object') hasValues = hasExpectedValues(object[key], expected[key])
    else hasValues = object[key] === expected[key]

    if (hasValues === false) break
  }

  return hasValues
}

export * from './api-verify-raw-body-schema.util'
export * from './did.util'
export * from './self-description.util'
