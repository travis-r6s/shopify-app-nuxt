<template>
  <Page
    title="3/4 inch Leather pet collar"
    subtitle="Perfect for any pet"
    compact-title
    :back-action="{ content: 'Products', onAction: () => navigateTo('/') }"
    :primary-action="{ content: 'Save', disabled: true }"
    :secondary-actions="[
      {
        content: 'Duplicate',
        accessibilityLabel: 'Secondary action label',
        onAction: () => console.log('Duplicate action'),
      },
      {
        content: 'View on your store',
        onAction: () => console.log('View on your store action'),
      },
    ]"
    :action-groups="[
      {
        title: 'Promote',
        actions: [
          {
            content: 'Share on Facebook',
            accessibilityLabel: 'Individual action label',
            onAction: () => console.log('Share on Facebook action'),
          },
        ],
      },
    ]"
    :pagination="{
      hasPrevious: true,
      hasNext: true,
    }"
  >
    <template #pageTitle>
      <Badge tone="success">
        Paid
      </Badge>
    </template>
    <LegacyCard
      title="Credit card"
      sectioned
    >
      <Text as="p">
        Credit card information
      </Text>
    </LegacyCard>
  </Page>
</template>
