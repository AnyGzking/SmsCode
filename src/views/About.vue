<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Github, Globe2, MessageCircleMore, Send, ShieldCheck, Sparkles } from 'lucide-vue-next'
import MainLayout from '@/layouts/MainLayout.vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { usePublicStore } from '@/store/modules/public'
import { storeToRefs } from 'pinia'

const { t, tm } = useI18n()
const publicStore = usePublicStore()
const { parsedContact } = storeToRefs(publicStore)

const values = computed(() => tm('pages.about.values.items') as Array<{ title: string; description: string }>)
const contacts = computed(() => {
  const items = tm('pages.about.contacts.items') as Array<{
    key: string
    title: string
    defaultValue: string
    defaultHref: string
  }>

  return items.map((item) => {
    const current = parsedContact.value[item.key] || {}
    return {
      ...item,
      value: current.value || item.defaultValue,
      href: current.href || item.defaultHref,
    }
  })
})

const valueIcons = [Globe2, Sparkles, ShieldCheck]
const contactIcons = [Send, Github, MessageCircleMore]
</script>

<template>
  <MainLayout>
    <section :class="cn(
      'relative w-full overflow-hidden',
      'bg-white dark:bg-black'
    )">
      <div :class="cn(
        'absolute inset-0',
        '[background-size:40px_40px]',
        '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
        'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]'
      )" />

      <div class="pointer-events-none absolute inset-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
      <div class="pointer-events-none absolute left-0 right-0 top-24 mx-auto h-72 w-72 rounded-full bg-[#42b883]/20 blur-[120px]" />

      <div class="relative container mx-auto px-4 py-20 md:px-6 md:py-24 2xl:max-w-[1400px]">
        <div class="mx-auto max-w-3xl text-center">
          <div class="inline-flex items-center rounded-full border border-[#42b883]/20 bg-[#42b883]/10 px-4 py-1.5 text-sm font-medium text-[#42b883] backdrop-blur-sm">
            {{ t('pages.about.hero.badge') }}
          </div>
          <h1 class="mt-6 text-4xl font-extrabold tracking-tight lg:text-7xl">
            {{ t('pages.about.hero.title') }}
          </h1>
          <p class="mx-auto mt-6 max-w-3xl text-xl leading-8 text-muted-foreground">
            {{ t('pages.about.hero.description') }}
          </p>
        </div>

        <div class="mx-auto mt-16 max-w-6xl">
          <div class="mb-8 text-center">
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
              {{ t('pages.about.values.title') }}
            </h2>
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div
              v-for="(item, index) in values"
              :key="item.title"
              class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#42b883]/40 dark:border-zinc-800 dark:bg-black/50"
            >
              <div class="rounded-xl bg-[#42b883]/10 p-3 text-[#42b883] w-fit">
                <component :is="valueIcons[index]" class="h-5 w-5" />
              </div>
              <h3 class="mt-5 text-xl font-semibold text-gray-900 dark:text-gray-100">
                {{ item.title }}
              </h3>
              <p class="mt-3 text-sm leading-6 text-muted-foreground">
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>

        <div class="mx-auto mt-20 max-w-6xl">
          <div class="mx-auto max-w-3xl text-center">
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
              {{ t('pages.about.contacts.title') }}
            </h2>
            <p class="mt-4 text-lg leading-7 text-muted-foreground">
              {{ t('pages.about.contacts.description') }}
            </p>
          </div>

          <div class="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            <a
              v-for="(item, index) in contacts"
              :key="item.title"
              :href="item.href"
              target="_blank"
              rel="noopener noreferrer"
              class="group rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#42b883]/40 dark:border-zinc-800 dark:bg-black/50"
            >
              <div class="rounded-xl bg-[#42b883]/10 p-3 text-[#42b883] w-fit transition-transform duration-300 group-hover:scale-105">
                <component :is="contactIcons[index]" class="h-5 w-5" />
              </div>
              <h3 class="mt-5 text-xl font-semibold text-gray-900 dark:text-gray-100">
                {{ item.title }}
              </h3>
              <p class="mt-3 break-all text-sm leading-6 text-muted-foreground">
                {{ item.value }}
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>
