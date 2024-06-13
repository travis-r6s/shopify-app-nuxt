<template>
  <Page narrow-width>
    <Layout style="min-height: 100vh;">
      <LayoutSection style="margin: auto;">
        <Card rounded-above="sm">
          <Text
            as="h1"
            variant="headingXl"
          >
            Login
          </Text>
          <Box padding-block-start="200">
            <Text
              as="p"
              variant="bodyMd"
            >
              Enter your shop name below to get started.
            </Text>
          </Box>
          <br>
          <Form @submit.prevent="handleSubmit">
            <FormLayout>
              <TextField
                v-model="shop"
                label="Shop Name"
                auto-complete="off"
                required
                placeholder="store-name"
                label-hidden
                focused
                suffix=".myshopify.com"
              >
                <template #helpText>
                  <span v-if="store">Your store URL is: {{ store }}</span>
                </template>
              </TextField>

              <Button
                type="submit"
                variant="primary"
                :loading="isLoading"
              >
                Submit
              </Button>
            </FormLayout>
          </Form>
        </Card>
      </LayoutSection>
    </Layout>
  </Page>
</template>

<script setup lang="ts">
const shop = ref()
const [isLoading, toggleLoading] = useToggle(false)

const store = computed(() => shop.value ? `${shop.value}.myshopify.com` : '')

/** app-bridge will handle the redirect, so just reload the homepage with the new query param */
function handleSubmit() {
  if (!store.value) {
    return
  }

  toggleLoading(true)
  navigateTo({ path: '/auth/login', query: { shop: store.value } }, { external: true })
}
</script>
