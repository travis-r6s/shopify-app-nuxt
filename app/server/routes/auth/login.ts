export default defineEventHandler((event) => {
  const { shopify } = useRuntimeConfig()

  const shop = getShop(event)
  event.context.$sentry?.addBreadcrumb({ message: 'Handling /auth/login request', data: { shop } })

  if (!shop) {
    event.context.$sentry?.addBreadcrumb({
      level: 'error',
      message: `Missing shop parameter, redirecting back to ${authRoutes.loginPath}`,
      data: { redirectPath: authRoutes.loginPath },
    })
    return sendRedirect(event, authRoutes.loginPath)
  }

  const adminPath = shopifyApi.utils.legacyUrlToShopAdminUrl(shop)
  const redirectUrl = `https://${adminPath}/oauth/install?client_id=${shopify.apiKey}`

  event.context.$sentry?.addBreadcrumb({
    level: 'info',
    message: `Redirecting login request to ${redirectUrl}`,
    data: { redirectUrl, shop },
  })

  return sendRedirect(event, redirectUrl)
})
