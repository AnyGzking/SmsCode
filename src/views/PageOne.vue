<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="w-full h-full flex items-center justify-center">
    <h1 class="text-4xl font-bold">
      {{ t('pages.page_one') }}
    </h1>
  </div>
</template>
