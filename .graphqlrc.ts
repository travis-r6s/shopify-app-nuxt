import fs from 'node:fs'
import { ApiVersion } from '@shopify/shopify-api'
import { ApiType, shopifyApiProject } from '@shopify/api-codegen-preset'
import type { IGraphQLConfig } from 'graphql-config'

// No idea what any of this does, or how it works!

function getConfig() {
  const config: IGraphQLConfig = {
    projects: {
      app: shopifyApiProject({
        apiType: ApiType.Admin,
        apiVersion: ApiVersion.April24,

        documents: ['./app/pages/**/*.{ts,vue}', './app/components/**/*.{ts,vue}'],
        outputDir: './app/types',
      }),
      default: shopifyApiProject({

        apiType: ApiType.Admin,
        apiVersion: ApiVersion.April24,

        documents: ['./app/server/**/*.ts'],
        outputDir: './app/server/types',

      }),
    },
  }

  let extensions: string[] = []
  try {
    extensions = fs.readdirSync('./extensions')
  } catch {
    // ignore if no extensions
  }

  for (const entry of extensions) {
    const extensionPath = `./extensions/${entry}`
    const schema = `${extensionPath}/schema.graphql`
    if (fs.existsSync(schema)) {
      config.projects[entry] = {
        schema,
        documents: [`${extensionPath}/**/*.graphql`],
      }
    }
  }

  return config
}

module.exports = getConfig()
