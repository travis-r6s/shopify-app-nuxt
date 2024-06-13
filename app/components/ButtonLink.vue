<template>
  <Button
    type="button"
    @click="navigate"
    v-bind="props"
  >
    <slot />
  </Button>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'
import type { NavigateToOptions } from '#app/composables/router'

interface Props {
  to: RouteLocationRaw
  options?: NavigateToOptions
  // Polaris Options
  /**
   * Changes the size of the button, giving it more or less padding
   * @default 'medium'
   */
  size?: 'micro' | 'slim' | 'medium' | 'large'
  /** Changes the inner text alignment of the button */
  textAlign?: 'left' | 'right' | 'center' | 'start' | 'end'
  /** Allows the button to grow to the width of its container */
  fullWidth?: boolean
  /** Displays the button with a disclosure icon. Defaults to `down` when set to true */
  disclosure?: 'down' | 'up' | 'select' | boolean
  /**
   * Removes underline from button text (including on interaction)
   * @deprecated Use a variant instead
   */
  removeUnderline?: boolean
  /** Icon to display to the left of the button content */
  icon?: string
  /** Indicates whether or not the button is the primary navigation link when rendered inside of an `IndexTable.Row` */
  dataPrimaryLink?: boolean
  /** Sets the color treatment of the Button. */
  tone?: 'critical' | 'success'
  /** Changes the visual appearance of the Button. */
  variant?: 'plain' | 'primary' | 'secondary' | 'tertiary' | 'monochromePlain'
}

const props = defineProps<Props>()

async function navigate() {
  await navigateTo(props.to, props.options)
}
</script>
