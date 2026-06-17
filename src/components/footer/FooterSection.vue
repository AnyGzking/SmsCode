<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FooterSection as FooterSectionType } from './config'

interface Props {
  section: FooterSectionType
  className?: string
}

const props = defineProps<Props>()
const { t } = useI18n()
</script>

<template>
  <div :class="`flex flex-col gap-2 md:gap-4 ${props.className || ''}`">
    <h3 class="pt-1 text-sm font-semibold">{{ t(props.section.titleKey) }}</h3>
    <template v-for="item in props.section.items" :key="item.titleKey">
      <router-link
        v-if="item.href"
        :to="item.href"
        class="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {{ t(item.titleKey) }}
      </router-link>
      <span
        v-else
        class="text-sm text-muted-foreground/60 cursor-default"
      >
        {{ t(item.titleKey) }}
      </span>
    </template>
  </div>
</template>
