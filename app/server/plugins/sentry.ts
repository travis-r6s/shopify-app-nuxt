import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import type { LogType } from 'consola'
import { H3Error } from 'h3'

const sentryLevelToLogLevelMap = new Map<Sentry.SeverityLevel, LogType>([
  ['debug', 'debug'],
  ['error', 'error'],
  ['fatal', 'fatal'],
  ['info', 'info'],
  ['log', 'log'],
  ['warning', 'warn'],
])

/**
 * A basic Sentry integration, thanks to: https://www.lichter.io/articles/nuxt3-sentry-recipe/
 */
export default defineNitroPlugin((nitroApp) => {
  const { public: { sentry } } = useRuntimeConfig()

  const logger = createLogger('Sentry')

  // If no sentry DSN set, ignore and warn in the console
  if (!sentry.dsn) {
    console.warn('Sentry DSN not set, skipping Sentry initialization')
    return
  }

  // Initialize Sentry
  Sentry.init({
    dsn: sentry.dsn,
    environment: sentry.environment,
    integrations: [nodeProfilingIntegration()],
    // Performance Monitoring
    tracesSampleRate: import.meta.dev ? 1.0 : 0.5,
    profilesSampleRate: import.meta.dev ? 1.0 : 0.5,

    // Add our custom breadcrumb -> console logs
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.message) {
        const level = breadcrumb.level && sentryLevelToLogLevelMap.get(breadcrumb.level) || 'debug'
        const args = breadcrumb.data ? [breadcrumb.data] : []
        logger[level](breadcrumb.message, ...args)
      }

      return breadcrumb
    },
  })

  // Here comes the hooks
  nitroApp.hooks.hook('error', (error) => {
    if (error instanceof H3Error) {
      if (error.statusCode < 500) {
        logger.error(error.message, error)
        return
      }
    }

    Sentry.captureException(error)
  })

  nitroApp.hooks.hook('request', (event) => {
    const url = getRequestURL(event)
    Sentry.setTag('path', url.pathname)
    event.context.$sentry = Sentry
  })

  nitroApp.hooks.hookOnce('close', async () => {
    await Sentry.close(2000)
  })
})

declare module 'h3' {
  interface H3EventContext {
    $sentry?: typeof Sentry
  }
}
