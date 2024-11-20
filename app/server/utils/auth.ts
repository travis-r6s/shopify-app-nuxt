import type { H3Event } from 'h3'
import { type GraphqlClient, InvalidJwtError, type JwtPayload, RequestedTokenType, Session } from '@shopify/shopify-api'
import { shopifyTokenHeader } from '~/consts'

const SESSION_TOKEN_PARAM = 'id_token' as const

interface QueryParams {
  shop?: string
  host?: string
  [SESSION_TOKEN_PARAM]?: string
  embedded?: '1'
}

const logger = createLogger('Auth Utils')

export const authRoutes = {
  path: '/auth',
  callbackPath: `/auth/callback`,
  patchSessionTokenPath: `/auth/session-token`,
  exitIframePath: `/auth/exit-iframe`,
  loginPath: `/login`,
}

export function getShop(event: H3Event): string | null {
  const params = getQuery<QueryParams>(event)
  if (!params.shop) {
    return null
  }

  return shopifyApi.utils.sanitizeShop(params.shop, false)
}

export function getHost(event: H3Event): string | null {
  const params = getQuery<QueryParams>(event)
  if (!params.host) {
    return null
  }

  return shopifyApi.utils.sanitizeHost(params.host, false)
}

export function validateShopAndHostParams(event: H3Event) {
  const shop = getShop(event)
  if (!shop) {
    event.context.$sentry?.addBreadcrumb({
      level: 'error',
      message: 'Missing or invalid shop, redirecting to login path',
      data: { shop, redirectPath: authRoutes.loginPath, query: getQuery(event) },
    })
    throw sendRedirect(event, authRoutes.loginPath)
  }

  const host = getHost(event)
  if (!host) {
    event.context.$sentry?.addBreadcrumb({
      level: 'error',
      message: 'Missing or invalid host, redirecting to login path',
      data: { shop, host, redirectPath: authRoutes.loginPath, query: getQuery(event) },
    })
    throw sendRedirect(event, authRoutes.loginPath)
  }
}

/** Gets the session token for the current request */
export async function getSessionId(event: H3Event) {
  const sessionId = await shopifyApi.session.getCurrentId({
    isOnline: true,
    rawRequest: event,
  })

  return sessionId
}

export function getSessionTokenHeader(event: H3Event): string | undefined {
  return getHeader(event, shopifyTokenHeader)
}

export function getSessionTokenFromUrlParam(event: H3Event): string | undefined {
  const params = getQuery<QueryParams>(event)
  return params[SESSION_TOKEN_PARAM]
}

export async function respondToBouncePageRequest(event: H3Event) {
  const url = getRequestURL(event)

  if (url.pathname === authRoutes.patchSessionTokenPath) {
    logger.debug('Rendering bounce page')
    throw renderAppBridge(event)
  }
}

export async function respondToExitIframeRequest(event: H3Event) {
  const url = getRequestURL(event)

  if (url.pathname === authRoutes.exitIframePath) {
    const destination = url.searchParams.get('exitIframe')!

    logger.debug('Rendering exit iframe page', { destination })
    throw renderAppBridge(event, { url: destination })
  }
}

export type RedirectTarget = '_self' | '_parent' | '_top'
export interface RedirectToOptions {
  url: string | URL
  target?: RedirectTarget
}

export function renderAppBridge(event: H3Event, redirectTo?: RedirectToOptions) {
  const { shopify } = useRuntimeConfig()
  let redirectToScript = ''

  setResponseHeader(event, 'content-type', 'text/html;charset=utf-8')

  const shop = getShop(event)

  if (shop) {
    setResponseHeaders(event, {
      'Link': '<https://cdn.shopify.com/shopifycloud/app-bridge.js>; rel="preload"; as="script";',
      'Content-Security-Policy': `frame-ancestors https://${shop} https://admin.shopify.com ${shopify.appUrl};`,
    })
  }

  if (redirectTo) {
    const destination = redirectTo.url

    const target = redirectTo.target ?? '_top'

    redirectToScript = `<script>window.open(${JSON.stringify(
      destination.toString(),
    )}, ${JSON.stringify(target)})</script>`
  }

  throw send(event, `
      <script data-api-key="${shopify.apiKey}" src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
      ${redirectToScript}
    `)
}

export async function ensureAppIsEmbeddedIfRequired(event: H3Event) {
  const shop = getShop(event)
  const params = getQuery<QueryParams>(event)

  if (params.embedded !== '1') {
    logger.debug('App is not embedded, redirecting to Shopify', { shop })
    await redirectToShopifyOrAppRoot(event)
  }
};

export function ensureSessionTokenSearchParamIfRequired(event: H3Event) {
  const params = getQuery<QueryParams>(event)

  const shop = getShop(event)
  const searchParamSessionToken = getSessionTokenFromUrlParam(event)
  const isEmbedded = params.embedded === '1'

  if (isEmbedded && !searchParamSessionToken) {
    logger.debug('Missing session token in search params, going to bounce page', { shop })
    throw redirectToBouncePage(event)
  }
};

export async function redirectToShopifyOrAppRoot(event: H3Event, _responseHeaders?: Headers) {
  const redirectUrl = await shopifyApi.auth.getEmbeddedAppUrl({ rawRequest: event })

  throw sendRedirect(event, redirectUrl)
}

export function redirectToBouncePage(event: H3Event) {
  const { shopify } = useRuntimeConfig()
  const url = getRequestURL(event)
  url.searchParams.delete('id_token')

  // Make sure we always point to the configured app URL so it also works behind reverse proxies (that alter the Host header).
  url.searchParams.set('shopify-reload', `${shopify.appUrl}${url.pathname}?${url.searchParams.toString()}`)

  const redirectPath = `${authRoutes.patchSessionTokenPath}?${url.searchParams.toString()}`
  event.context.$sentry?.addBreadcrumb({ message: 'Redirecting to bounce page', data: { redirectPath } })
  throw sendRedirect(event, redirectPath)
};

export interface SessionTokenContext {
  shop: string
  sessionId: string
  sessionToken: string
  payload: JwtPayload
}

export async function getSessionTokenContext(event: H3Event): Promise<SessionTokenContext> {
  event.context.$sentry?.addBreadcrumb({ message: 'Running getSessionTokenContext' })

  const headerSessionToken = getSessionTokenHeader(event)
  const searchParamSessionToken = getSessionTokenFromUrlParam(event)
  const sessionToken = headerSessionToken ?? searchParamSessionToken
  if (!sessionToken) {
    event.context.$sentry?.addBreadcrumb({ message: 'No session token found, redirecting to bounce page', level: 'error', data: { redirectUrl: authRoutes.patchSessionTokenPath } })
    throw redirectToBouncePage(event)
  }

  event.context.$sentry?.addBreadcrumb({ message: 'Attempting to authenticate session token' })

  const payload = await validateSessionToken(event, sessionToken)
  const dest = new URL(payload.dest)
  const shop = dest.hostname

  const sessionId = shopifyApi.session.getOfflineId(shop)
  event.context.$sentry?.addBreadcrumb({ message: 'Session token is valid, and got sessionId', data: { shop, sessionId } })

  return { shop, payload, sessionId, sessionToken }
}

export async function validateSessionToken(event: H3Event, token: string): Promise<JwtPayload> {
  logger.debug('Validating session token')

  try {
    const payload = await shopifyApi.session.decodeSessionToken(token, { checkAudience: true })
    logger.debug('Session token is valid', { dest: payload.dest })

    return payload
  } catch (error) {
    if (error instanceof Error) {
      logger.debug(`Failed to validate session token: ${error.message}`)
    }

    throw respondToInvalidSessionToken(event, true)
  }
}

export function respondToInvalidSessionToken(event: H3Event, retryRequest = false) {
  event.context.$sentry?.addBreadcrumb({ message: 'Running respondToInvalidSessionToken', data: { retryRequest } })

  const isDocumentRequest = !getSessionTokenHeader(event)
  if (isDocumentRequest) {
    event.context.$sentry?.addBreadcrumb({
      message: `Document request, redirecting to bounce page`,
      data: { isDocumentRequest, token: getSessionTokenHeader(event) },
    })

    return redirectToBouncePage(event)
  }

  if (retryRequest) {
    event.context.$sentry?.addBreadcrumb({
      message: `Retry request, setting shopify retry header`,
      data: { 'X-Shopify-Retry-Invalid-Session-Request': '1' },
    })
    setResponseHeader(event, 'X-Shopify-Retry-Invalid-Session-Request', '1')
  }

  event.context.$sentry?.addBreadcrumb({
    message: `Throwing error as we don't know what to do here!`,
    level: 'error',
  })

  throw createError({
    statusCode: 401,
    statusText: 'Unauthorized',
  })
}

export interface SessionContext {
  shop: string
  session?: Session
  sessionToken?: string
}

/**
 * Accepts a `sessionToken` (from the current request), and an optional existing `session` (from the DB).
 * It validates the `sessionToken`, and either returns the existing session if it exists, or handles
 * the token exchange to get a new access token, saves it to the DB, and runs any post-install steps
 * (i.e. registering webhooks).
 */
export async function authenticateSession(event: H3Event, { shop, session, sessionToken }: SessionContext): Promise<Session> {
  event.context.$sentry?.addBreadcrumb({
    message: 'Authenticating session',
    data: { shop, sessionToken },
  })

  if (!sessionToken) {
    throw sendError(event, new InvalidJwtError())
  }

  if (session?.isActive(undefined)) {
    event.context.$sentry?.addBreadcrumb({
      message: 'Session is active, returning session',
      data: { shop, isActive: session.isActive(undefined), sessionToken },
    })
    return session
  }

  event.context.$sentry?.addBreadcrumb({ message: 'No valid session found, requesting offline access token' })

  const { session: offlineSession } = await shopifyApi.auth.tokenExchange({
    requestedTokenType: RequestedTokenType.OfflineAccessToken,
    sessionToken,
    shop,
  })

  event.context.$sentry?.addBreadcrumb({ message: 'Storing session in DB' })
  await orm.sessions.upsert(offlineSession.toObject())

  try {
    event.context.$sentry?.addBreadcrumb({ message: 'Registering webhooks', data: { webhooks: shopifyApi.webhooks.getTopicsAdded() } })
    await shopifyApi.webhooks.register({ session: offlineSession })
  } catch (error) {
    event.context.$sentry?.captureException(error)

    if (error instanceof Error) {
      logger.error(error.message)

      throw createError({
        message: `Failed to register webhooks - ${error.message}`,
        statusMessage: 'Failed to register webhooks',
        statusCode: 500,
      })
    } else {
      logger.error(error)
    }
  }

  event.context.$sentry?.addBreadcrumb({ message: 'Finished authenticating session, returning new offline session' })
  return offlineSession
}

/**
 * Fetch a saved session from the DB.
 */
export async function fetchExistingSession(sessionId: string): Promise<Session | undefined> {
  const dbSession = await orm.sessions.find(sessionId)
  if (dbSession) {
    return new Session(dbSession)
  }
}

/**
 * Runs a literal ton of checks to handle the various cases where we may or may not be embedded,
 * may have missing tokens, may not be installed, etc., and redirects to the relevant pages as needed.
 *
 * If everything is successful, it returns a `Session` object that we can use for API requests.
 */
export async function assertSession(event: H3Event): Promise<Session> {
  event.context.$sentry?.addBreadcrumb({ message: 'Running assertSession function' })

  event.context.$sentry?.addBreadcrumb({ message: 'Running redirect request handlers' })
  await respondToBouncePageRequest(event)
  await respondToExitIframeRequest(event)

  event.context.$sentry?.addBreadcrumb({ message: 'Checking for valid session token' })

  // If this is a valid request, but it doesn't have a session token header, this is a document request. We need to
  // ensure we're embedded if needed and we have the information needed to load the session.
  const sessionTokenHeader = getSessionTokenHeader(event)
  if (!sessionTokenHeader) {
    event.context.$sentry?.addBreadcrumb({ message: 'No session token header, so running embedded checks', level: 'warning' })
    validateShopAndHostParams(event)
    await ensureAppIsEmbeddedIfRequired(event)
    ensureSessionTokenSearchParamIfRequired(event)
  }

  event.context.$sentry?.addBreadcrumb({ message: 'Authenticating admin request' })

  const { shop, sessionId, sessionToken } = await getSessionTokenContext(event)

  event.context.$sentry?.addBreadcrumb({ message: 'Loading session from storage', data: { sessionId, shop } })

  const existingSession = await fetchExistingSession(sessionId)

  event.context.$sentry?.addBreadcrumb({ message: 'Fetched existing session from DB, validating and authehticating sessions' })

  const session = await authenticateSession(event, {
    session: existingSession,
    sessionToken,
    shop,
  })

  event.context.$sentry?.addBreadcrumb({ message: 'Request is valid, loaded session from session token', data: { shop: session.shop } })

  return session
}

interface UseShopify {
  session: Session
  admin: GraphqlClient
}

/**
 * Not sure of naming, but in our API routes we want to assert a session, and return the session + instantiate graphql client.
 */
export async function useShopify(event: H3Event): Promise<UseShopify> {
  const session = await assertSession(event)

  const admin = new shopifyApi.clients.Graphql({ session, apiVersion: shopifyApi.config.apiVersion })

  return { session, admin }
}
