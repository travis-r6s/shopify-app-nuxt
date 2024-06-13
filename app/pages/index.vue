<template>
  <Page
    title="Home"
    subtitle="Welcome to your new app"
  >
    <Layout>
      <LayoutSection>
        <Card rounded-above="sm">
          <Text
            as="h2"
            variant="headingSm"
          >
            Overview
          </Text>
          <Box padding-block-start="200">
            <BlockStack gap="500">
              <Text
                as="p"
                variant="bodyMd"
              >
                Find some links to different pages below. Checkout the Products page to see an API request in action!
              </Text>
              <InlineStack gap="500">
                <ButtonLink
                  variant="primary"
                  to="/about"
                >
                  About
                </ButtonLink>
                <ButtonLink
                  variant="primary"
                  to="/products"
                >
                  Products
                </ButtonLink>
              </InlineStack>
            </BlockStack>
          </Box>
        </Card>
      </LayoutSection>

      <LayoutSection variant="oneThird">
        <Card rounded-above="sm">
          <Text
            as="h2"
            variant="headingSm"
          >
            Info
          </Text>
          <Box padding-block-start="200">
            <Text
              as="p"
              variant="bodyMd"
            >
              Some extra info about this page
            </Text>
          </Box>
        </Card>
      </LayoutSection>
    </Layout>
  </Page>
</template>

<script setup>
import { InlineStack } from '@ownego/polaris-vue'
import consola from 'consola'

const token = await useShopify().idToken()
consola.log({ token })
</script>
