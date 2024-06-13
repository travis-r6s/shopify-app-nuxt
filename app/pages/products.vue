<template>
  <Page
    title="Products"
    :back-action="{ content: 'Home', onAction: () => navigateTo('/') }"
  >
    <Layout>
      <LayoutSection>
        <Card>
          <InlineError
            v-if="error"
            :message="error.message"
            field-id=""
          />
          <DataTable
            :column-content-types="columnContentTypes"
            :headings="headings"
            :rows="rows"
          />
        </Card>
      </LayoutSection>
    </Layout>
  </Page>
</template>

<script lang="ts" setup>
const headings = ['ID', 'Title', 'Handle']
const columnContentTypes: any[] = ['text', 'text', 'text']

const { data, error } = await useAPI('/api/products')

const rows = computed(() => data.value?.map(node => [node.id, node.title, node.handle]) ?? [])
</script>
