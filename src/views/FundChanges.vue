<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { watchEffect } from 'vue'

const { t } = useI18n()

watchEffect(() => {
  document.title = t('navigation.fundChanges')
})
</script>

<template>
  <div class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50">
    <h2 class="text-2xl font-semibold">{{ t('navigation.fundChanges') }}</h2>
    <p class="mt-3 text-sm text-muted-foreground">Fund changes page placeholder. We will refine it next.</p>
  </div>
</template>
