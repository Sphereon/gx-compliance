export function clone(objectToClone) {
  return JSON.parse(JSON.stringify(objectToClone))
}

export * from './did.util'
export * from './self-description.util'
export * from './public-key.utils'
