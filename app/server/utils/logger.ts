import consola from 'consola'

const baseLogger = consola.create({
  // 4 = debug; 0 = error
  level: import.meta.dev ? 4 : 0
})

export function createLogger(tag: string) {
  return baseLogger.withTag(tag)
}
