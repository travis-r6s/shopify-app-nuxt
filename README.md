# Shopify App Nuxt Template

The [Shopify App Remix template](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-app-remix#readme) provides a whole load of functionality around embedded app auth that they don't really document (or give examples for) or provide for the agnostic SDK's. I wanted to use Nuxt + [Polaris Vue](https://ownego.github.io/polaris-vue/), so I spent some time porting the various low-level functions to make them compatible with [H3](https://h3.unjs.io) and added the middleware + session authentication handlers so they can be used with the [Nitro](https://nitro.unjs.io) server.

## Notes

### Opinionated
I intend to use this for my own use, so this is an **opinionated** setup. I likely won't change it to be a generic boilerplate, but you can definitely duplicate the repository and adjust it as you need it.

### Azure SWA
I frequently use [Azure SWA](https://azure.microsoft.com/en-us/products/app-service/static) to deploy websites, and [Nitro](https://nitro.unjs.io) even has a [preset](https://nitro.unjs.io/deploy/providers/azure#azure-static-web-apps) for this. However, there are some oddities when using the platform - in this case, specifically that the Azure SWA -> Functions App proxy sets an `Authorization` header to authenticate the traffic between the web app and the functions app. However, by default [Shopify App Bridge](https://shopify.dev/docs/api/app-bridge-library) also sets this header on our client-side fetch requests to add the Shopify [ID token](https://shopify.dev/docs/api/app-bridge-library/apis/id-token), which is used in the server to check for a valid session. As this gets overwritten by the SWA token, this causes the session verification to fail as it is now not a valid Shopify ID Token.

As a workaround till this is fixed, we use a custom fetch instance ([`/app/plugins/shopify.ts`](/app/plugins/shopify.ts)) to add a different header name with the value of an ID token, and check that header on our server instead of the `Authorization` header.

### Session Storage
Sessions need to be saved in a database. As I deploy to [Azure SWA](https://azure.microsoft.com/en-us/products/app-service/static), I also use [Azure Cosmos](https://azure.microsoft.com/en-us/products/cosmos-db) as a DB, and so the `fetchExistingSession` & `authenticateSession` (see [`/app/server/utils/auth.ts`](/app/server/utils/auth.ts)) functions use a Cosmos client to fetch/save sessions. This can be replaced by any other client though - for example, you could instead use [Nitro KV Storage](https://nitro.unjs.io/guide/storage) for this.


## Get Started

```sh
# Clone repo
npx degit github:travis-r6s/shopify-app-nuxt

# Install dependencies
pnpm install


# Add Nuxt ENV's
cp app/.env.example app/.env
code app/.env


# Create/link app config
pnpm config:link
pnpm config:use <config name used in previous step>

# Deploy initial version to Shopify
pnpm deploy


# Run development command
pnpm run dev

# Make hay!
```

## Build + Deploy

You'll need to deploy the Nuxt app to a hosting platform. I often use Azure SWA, so there is an example workflow for that in []`.github/workflows/example-swa-workflow.yml`](/.github/workflows/example-swa-workflow.yml).

Once that is done, edit the `shopify.app.prod.toml` file to set the `application_url` to your deployed site, and update the `redirect_urls` array to add your site with the pathname of `/auth/callback`. Next, use the Shopify CLI to deploy the production config:

```sh
# Run the deploy command, specifying the production config file
pnpm run deploy -c prod
```

Now you can visit the app in the Partners dashboard, and either install it to a development store, or set the distribution method as needed.

### Useful Links

- [App ENV's](https://shopify.dev/docs/apps/build/cli-for-apps/app-structure#dependency-management)

---

Have fun!
