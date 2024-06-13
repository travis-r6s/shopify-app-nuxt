<template>
  <AppProvider :i18n="locales">
    <NuxtLayout>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </NuxtLayout>
  </AppProvider>
</template>

<script setup lang="ts">
import { AppProvider } from '@ownego/polaris-vue'
import locales from '@ownego/polaris-vue/dist/locales/en.json'
</script>
