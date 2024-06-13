import { shopifyTokenHeader } from '~/consts'

/**
 * This is a custom plugin that wraps the default Nuxt $fetch function to add the authorization headers.
 *
 * On Azure SWA, the SWA -> Functions App proxy overwrites the `Authorization` header with its own value
 * (yes, it is silly, I agree), so we need to use another custom header to add the Shopify session token.
 *
 * The counterpart in the API also checks for this header instead of the `Authorization` header.
 */
export default defineNuxtPlugin(() => {
  const shopify = useShopify()

  const api = $fetch.create({
    baseURL: '/api',
    retry: 2,
    retryDelay: 500,
    responseType: 'json',
    onRequest: async ({ options }) => {
      shopify.loading(true)

      const idToken = await shopify.idToken()

      if (idToken) {
        const headers = options.headers ||= {}
        if (Array.isArray(headers)) {
          headers.push([shopifyTokenHeader, idToken])
        } else if (headers instanceof Headers) {
          headers.set(shopifyTokenHeader, idToken)
        } else {
          Reflect.set(headers, shopifyTokenHeader, idToken)
        }
      }
    },
    onResponse: () => {
      shopify.loading(false)
    },
    onResponseError: async ({ response }) => {
      if (response.status === 401) {
        await navigateTo('/login')
      }
    },
  })

  // Expose to useNuxtApp().$api
  return {
    provide: {
      api,
    },
  }
})
