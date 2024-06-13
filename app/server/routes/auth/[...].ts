export default defineEventHandler(async (event) => {
  event.context.$sentry?.addBreadcrumb({ message: `Handling auth request on ${event.path}`, data: { headers: getHeaders(event) } })

  const shop = getShop(event)
  if (typeof shop !== 'string') {
    event.context.$sentry?.addBreadcrumb({ message: 'Missing shop query param, redirecting to login', level: 'error', data: { redirectPath: authRoutes.loginPath } })

    return sendRedirect(event, authRoutes.loginPath)
  }

  const paramSessionToken = getSessionTokenFromUrlParam(event)
  const headerSessionToken = getSessionTokenHeader(event)

  const sessionToken = headerSessionToken ?? paramSessionToken
  if (typeof sessionToken !== 'string') {
    event.context.$sentry?.addBreadcrumb({ message: 'Missing session token, redirecting to login', level: 'error', data: { redirectPath: authRoutes.loginPath } })
    return sendRedirect(event, authRoutes.loginPath)
  }

  await authenticateSession(event, { shop, sessionToken })
  event.context.$sentry?.addBreadcrumb({ message: 'Finished authenticating session', level: 'info' })
})
