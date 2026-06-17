<script setup lang="ts">
defineOptions({
  name: 'BlacklistNumber',
})

import NumberLogPage from '@/components/NumberLogPage.vue'
</script>

<template>
  <NumberLogPage
    :operation-type="1"
    title-key="pages.blacklistNumberPage.title"
    description-key="pages.blacklistNumberPage.description"
  />
</template>
