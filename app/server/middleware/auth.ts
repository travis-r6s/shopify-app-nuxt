/** Paths that don't need to be authenticated. */
const excludedPaths = [
  // Skip API routes, as we handle the authentication within them
  '/api',
  // Skip any auth checks if we are logging in from the /login page
  '/auth/login',
  // Skip any auth checks for the UI login page
  authRoutes.loginPath,
  // Nuxt error pages
  '/__nuxt_error',
]

/**
 * This handles a simple authorized check for the main app.
 * If we have a session token, then we can continue. If we don't, but we have a shop query param,
 * then we can also continue as app-bridge will use that to auto-redirect us to the embedded app page.
 *
 * Otherwise, redirect to the /auth/login page, which will prompt for a shop name - we can then
 * use that to create a redirect to install the app.
 */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  event.context.$sentry?.addBreadcrumb({
    message: `Handling request ${url.pathname}`,
    data: { path: !import.meta.dev && event.path },
  })

  if (excludedPaths.some(path => event.path.startsWith(path))) {
    event.context.$sentry?.addBreadcrumb({
      message: 'Event path matches an excluded path, so skipping authentication',
      level: 'info',
      data: { path: event.path },
    })
    return
  }

  // Otherwise, this is our first load, so authenticate the request.
  event.context.$sentry?.addBreadcrumb({ message: 'Running assertSession to authenticate request' })
  const session = await assertSession(event)
  event.context.$sentry?.setUser({ id: session.id, username: session.shop })
  event.context.$sentry?.setContext('session', session.toObject())
  event.context.$sentry?.addBreadcrumb({ message: 'Finished authenticating request; as you were, good people', level: 'info' })
})
