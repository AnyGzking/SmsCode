<script setup lang="ts">
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  ShieldCheck,
  Signal,
  Waypoints,
  LockKeyhole,
} from 'lucide-vue-next'
import MainLayout from '@/layouts/MainLayout.vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t, tm } = useI18n()

const featureIcons = [
  BadgeDollarSign,
  BarChart3,
  ShieldCheck,
  Waypoints,
  Signal,
  LockKeyhole,
]

const features = computed(() => tm('home.features.items') as Array<{ title: string; description: string }>)
const stats = computed(() => tm('home.stats.items') as Array<{ label: string; value: string }>)
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
        <div class="mx-auto max-w-4xl text-center">
          <div class="inline-flex items-center rounded-full border border-[#42b883]/20 bg-[#42b883]/10 px-4 py-1.5 text-sm font-medium text-[#42b883] backdrop-blur-sm">
            {{ t('home.hero.badge') }}
          </div>

          <h1 class="mx-auto mt-6 max-w-4xl scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-7xl">
            {{ t('home.hero.title') }}
          </h1>

          <p class="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground leading-8">
            {{ t('home.hero.description') }}
          </p>

          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <router-link
              to="/sign-up"
              :class="cn(
                'group inline-flex items-center justify-center rounded-full',
                'bg-[#42b883] px-5 py-3 text-sm font-medium text-white',
                'hover:bg-[#42b883]/90',
                'transition-all duration-300 shadow-md'
              )"
            >
              {{ t('home.hero.cta') }}
              <ArrowRight :class="cn(
                'ml-2 h-4 w-4',
                'transition-transform group-hover:translate-x-1'
              )" />
            </router-link>

            <router-link
              to="/api"
              class="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-5 py-3 text-sm font-medium text-gray-900 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-white dark:hover:bg-zinc-900"
            >
              {{ t('home.hero.secondary') }}
            </router-link>
          </div>
        </div>

        <div class="mx-auto mt-16 max-w-6xl">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="item in stats"
              :key="item.label"
              class="rounded-2xl border border-zinc-200 bg-white/70 p-5 text-left shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50"
            >
              <p class="text-sm text-muted-foreground">{{ item.label }}</p>
              <p class="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{{ item.value }}</p>
            </div>
          </div>
        </div>

        <div class="mx-auto mt-20 max-w-6xl">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
              {{ t('home.features.title') }}
            </h2>
          </div>

          <div class="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="(item, index) in features"
              :key="item.title"
              class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#42b883]/40 dark:border-zinc-800 dark:bg-black/50"
            >
              <div class="flex items-start gap-4">
                <div class="rounded-xl bg-[#42b883]/10 p-3 text-[#42b883]">
                  <component :is="featureIcons[index]" class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ item.title }}
                  </h3>
                  <p class="mt-2 text-sm leading-6 text-muted-foreground">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>
