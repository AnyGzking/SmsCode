<script setup lang="ts">
const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  class?: string
}>(), {
  src: '',
  alt: '',
  class: '',
})

const cleanSrc = (value?: string) => String(value || '').replace(/`/g, '').trim()
</script>

<template>
  <img v-if="cleanSrc(props.src)" :src="cleanSrc(props.src)" :alt="props.alt" :class="props.class">
</template>
