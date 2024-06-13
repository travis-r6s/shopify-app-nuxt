import type { ShopifyGlobal } from '@shopify/app-bridge-types'
import type { UseFetchOptions } from 'nuxt/app'

export function useShopify(): ShopifyGlobal {
  return window.shopify
}

export function useAPI<T>(
  url: string | (() => string),
  options?: Omit<UseFetchOptions<T>, 'default'> & { default?: () => T | Ref<T> },
) {
  return useFetch(url, {
    lazy: true,
    ...options,
    $fetch: useNuxtApp().$api,
  })
}
