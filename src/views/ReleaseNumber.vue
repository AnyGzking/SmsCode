<script setup lang="ts">
defineOptions({
  name: 'ReleaseNumber',
})

import NumberLogPage from '@/components/NumberLogPage.vue'
</script>

<template>
  <NumberLogPage
    :operation-type="2"
    title-key="pages.releaseNumberPage.title"
    description-key="pages.releaseNumberPage.description"
  />
</template>
