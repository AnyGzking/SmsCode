<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  class?: string
}>(), {
  class: '',
})

const iconName = computed(() => String(props.name || '').replace(/`/g, '').trim())
</script>

<template>
  <Icon v-if="iconName" :icon="iconName" :class="props.class" />
</template>
