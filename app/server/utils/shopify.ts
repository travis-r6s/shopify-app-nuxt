import type { AdapterArgs } from '@shopify/shopify-api/runtime'
import type { H3Event } from 'h3'
import { ApiVersion, DeliveryMethod, LogSeverity, shopifyApi as createShopifyApi } from '@shopify/shopify-api'
import { restResources } from '@shopify/shopify-api/rest/admin/2024-04'
import { setAbstractConvertRequestFunc, setAbstractFetchFunc, setAbstractRuntimeString } from '@shopify/shopify-api/runtime'

interface H3AdapterArgs extends AdapterArgs {
  rawRequest: H3Event
}

setAbstractFetchFunc(fetch)
setAbstractRuntimeString(() => `H3 Runtime`)

setAbstractConvertRequestFunc(async ({ rawRequest }: H3AdapterArgs) => {
  return {
    headers: getHeaders(rawRequest) as Record<string, string>,
    method: rawRequest.method,
    url: getRequestURL(rawRequest).toString(),
  }
})

const { shopify } = useRuntimeConfig()

export const shopifyApi = createShopifyApi({
  apiKey: shopify.apiKey,
  apiSecretKey: shopify.secretKey,
  hostName: shopify.appUrl,
  apiVersion: ApiVersion.April24,
  isEmbeddedApp: true,
  restResources,
  logger: {
    httpRequests: false,
    timestamps: false,
    level: import.meta.dev ? LogSeverity.Warning : LogSeverity.Error,
  },
})

shopifyApi.webhooks.addHandlers({
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/api/webhooks',
  },
})
