<script setup lang="ts">
import { usePublicStore } from '@/store/modules/public'
const publicStore = usePublicStore()

defineProps<{
  withText?: boolean
}>()
</script>

<template>
  <router-link
    :to="{ name: 'home' }"
    title="Home link"
    class="flex justify-start gap-2 min-w-fit"
  >
    <img
      :src="publicStore.getConfigItem('site', 'logoUrl')"
      width="45"
      height="25"
      class="hidden dark:block"
      alt="logo"
    />
    <img
      :src="publicStore.getConfigItem('site', 'darkLogoUrl')"
      width="45"
      height="25"
      class="block dark:hidden"
      alt="logo"
    />
    <p v-if="withText" class="flex items-center text-black dark:text-white font-semibold text-base">
      {{ publicStore.getConfigItem('site', 'enSiteName') }}
    </p>
  </router-link>
</template>
