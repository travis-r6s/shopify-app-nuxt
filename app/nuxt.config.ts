import SVGLoader from 'vite-svg-loader'

export default defineNuxtConfig({
  devtools: { enabled: true },

  ssr: false,

  app: {
    head: {
      meta: [
        // @ts-expect-error No idea why they force these names, but this tag is used by App Bridge
        { name: 'shopify-api-key', content: process.env.SHOPIFY_API_KEY, tagPriority: 'critical' },
        { name: 'content-security-policy', content: ['frame-ancestors https://shopify-dev.myshopify.com https://admin.shopify.com'] },
      ],
      script: [
        {
          id: 'app-bridge',
          src: 'https://cdn.shopify.com/shopifycloud/app-bridge.js',
          tagPriority: 'high',
        },
      ],
    },
  },

  css: ['@ownego/polaris-vue/dist/style.css'],

  modules: [
    '@vueuse/nuxt',
  ],

  runtimeConfig: {
    /**
     * These are injected by Shopify when using the dev CLI - uses the .env file at the root of the workspace.
     * We set the runtime config values using the injected ENV names, so we have a nice typed interface to use them.
     * I.e. `useRuntimeConfig().shopify.apiKey // string`
     */
    shopify: {
      apiKey: process.env.SHOPIFY_API_KEY ?? '',
      secretKey: process.env.SHOPIFY_API_SECRET ?? '',
      appUrl: process.env.HOST ?? '',
    },
    /**
     * Set any other ENV's for Nuxt using a `.env` file in the app folder: `/app/.env`
     */
    cosmos: {
      connectionString: '',
    },
    public: {
      /** Public ENV's used clientside in App Bridge */
      shopify: {
        apiKey: process.env.SHOPIFY_API_KEY,
      },
      sentry: {
        dsn: '',
        environment: 'development',
      },
    },
  },

  build: {
    transpile: ['@ownego/polaris-vue'],
  },

  vite: {
    plugins: [
      SVGLoader({ }),
    ],
  },
})
