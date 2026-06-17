<script setup lang="ts">
import { cn } from '@/lib/utils'
import {
  ArrowDown,
  BookOpen,
  ChevronDown,
  FileJson,
  Globe,
  Key,
  Link as LinkIcon,
  ListTree,
  ShieldCheck,
} from 'lucide-vue-next'
import MainLayout from '@/layouts/MainLayout.vue'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const { t, tm } = useI18n()

const activeSection = ref('introduction')
const apiListExpanded = ref(true)
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://prod-cn.your-api-server.com'

const introductionItems = computed(() => tm('apiDoc.sections.introduction.items') as string[])
const introductionSummaryItems = computed(() => tm('apiDoc.sections.introduction.summaryItems') as string[])
const authenticationItems = computed(() => tm('apiDoc.sections.authentication.items') as string[])
const apiStandardsItems = computed(() => tm('apiDoc.sections.apiStandards.items') as string[])
const endpointSections = computed(() => tm('apiDoc.sections.apiList.items') as Array<{
  id: string
  title: string
  path: string
  method: string
  summary: string
  auth: string
  requestType: string
  params: Array<{
    name: string
    type: string
    required: boolean
    desc: string
    example: string
  }>
  successExample: string
}>)

const scrollTo = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSection.value = id
  }
}

const handleScroll = () => {
  const sections = ['introduction', 'authentication', 'api-standards', 'response-format', 'api-list', ...endpointSections.value.map(item => item.id)]
  let currentActive = 'introduction'

  for (const id of sections) {
    const element = document.getElementById(id)
    if (element && element.getBoundingClientRect().top <= 140) {
      currentActive = id
    }
  }

  activeSection.value = currentActive
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <MainLayout>
    <section :class="cn(
      'relative w-full',
      'bg-white dark:bg-black'
    )">
      <div :class="cn(
        'absolute inset-0',
        '[background-size:40px_40px]',
        '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
        'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]'
      )" />

      <div class="pointer-events-none absolute inset-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />

      <div class="relative container mx-auto px-4 md:px-6 2xl:max-w-[1400px] py-20 md:py-24">
        <div class="mx-auto max-w-2xl text-center">
          <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-7xl">
            {{ t('apiDoc.hero.title') }}
          </h1>
        </div>

        <div class="mx-auto mt-5 max-w-3xl text-center">
          <p class="text-muted-foreground text-xl">
            {{ t('apiDoc.hero.description') }}
          </p>
        </div>

        <div class="mt-8 flex justify-center gap-3">
          <button
            @click="scrollTo('introduction')"
            :class="cn(
              'group flex items-center rounded-full',
              'bg-[#42b883] px-6 py-3 text-sm font-medium text-white',
              'hover:bg-[#42b883]/90',
              'transition-all duration-300 shadow-md'
            )"
          >
            {{ t('apiDoc.button.start') }}
            <ArrowDown :class="cn(
              'ml-2 h-4 w-4',
              'transition-transform group-hover:translate-y-1'
            )" />
          </button>
        </div>

        <div class="mt-16 flex flex-col gap-10 lg:flex-row lg:items-start max-w-6xl mx-auto">
          <aside class="hidden w-full lg:sticky lg:top-24 lg:block lg:w-72 lg:flex-shrink-0">
            <nav class="space-y-1 rounded-xl border border-zinc-200 bg-white/70 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/50">
              <h4 class="mb-4 px-3 font-semibold text-gray-900 dark:text-gray-100">
                {{ t('apiDoc.toc.title') }}
              </h4>
              <button
                @click="scrollTo('introduction')"
                :class="cn(
                  'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-3',
                  activeSection === 'introduction' ? 'bg-[#42b883]/10 text-[#42b883] font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                )"
              >
                <BookOpen class="h-4 w-4" /> {{ t('apiDoc.toc.introduction') }}
              </button>
              <button
                @click="scrollTo('authentication')"
                :class="cn(
                  'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-3',
                  activeSection === 'authentication' ? 'bg-[#42b883]/10 text-[#42b883] font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                )"
              >
                <Key class="h-4 w-4" /> {{ t('apiDoc.toc.authentication') }}
              </button>
              <button
                @click="scrollTo('api-standards')"
                :class="cn(
                  'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-3',
                  activeSection === 'api-standards' ? 'bg-[#42b883]/10 text-[#42b883] font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                )"
              >
                <LinkIcon class="h-4 w-4" /> {{ t('apiDoc.toc.apiStandards') }}
              </button>
              <button
                @click="scrollTo('response-format')"
                :class="cn(
                  'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-3',
                  activeSection === 'response-format' ? 'bg-[#42b883]/10 text-[#42b883] font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                )"
              >
                <ShieldCheck class="h-4 w-4" /> {{ t('apiDoc.toc.responseFormat') }}
              </button>

              <div class="pt-2">
                <button
                  @click="apiListExpanded = !apiListExpanded"
                  :class="cn(
                    'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center justify-between',
                    activeSection === 'api-list' || endpointSections.some(item => item.id === activeSection)
                      ? 'bg-[#42b883]/10 text-[#42b883] font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                  )"
                >
                  <span class="flex items-center gap-3">
                    <ListTree class="h-4 w-4" /> {{ t('apiDoc.toc.apiList') }}
                  </span>
                  <ChevronDown class="h-4 w-4 transition-transform" :class="apiListExpanded ? 'rotate-180' : ''" />
                </button>

                <div v-show="apiListExpanded" class="mt-2 space-y-1 pl-4">
                  <button
                    @click="scrollTo('api-list')"
                    :class="cn(
                      'w-full rounded-lg px-3 py-2 text-left text-xs transition-colors',
                      activeSection === 'api-list'
                        ? 'bg-[#42b883]/10 text-[#42b883] font-medium'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                    )"
                  >
                    {{ t('apiDoc.sections.apiList.title') }}
                  </button>
                  <button
                    v-for="item in endpointSections"
                    :key="item.id"
                    @click="scrollTo(item.id)"
                    :class="cn(
                      'w-full rounded-lg px-3 py-2 text-left text-xs transition-colors',
                      activeSection === item.id
                        ? 'bg-[#42b883]/10 text-[#42b883] font-medium'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                    )"
                  >
                    {{ item.title }}
                  </button>
                </div>
              </div>
            </nav>
          </aside>

          <div class="flex-1 space-y-12">
            <section id="introduction" class="scroll-mt-24">
              <div class="mb-6 flex items-center gap-3 border-b border-zinc-200 pb-2 dark:border-zinc-800">
                <div class="rounded-lg bg-[#42b883]/10 p-2 text-[#42b883]">
                  <BookOpen class="h-6 w-6" />
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {{ t('apiDoc.sections.introduction.title') }}
                </h2>
              </div>
              <div class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50 prose dark:prose-invert max-w-none">
                <p>{{ t('apiDoc.sections.introduction.lead') }}</p>
                <ul>
                  <li v-for="item in introductionItems" :key="item">{{ item }}</li>
                </ul>
                <p>{{ t('apiDoc.sections.introduction.summary') }}</p>
                <h3>{{ t('apiDoc.sections.introduction.summaryTitle') }}</h3>
                <ul>
                  <li v-for="item in introductionSummaryItems" :key="item">{{ item }}</li>
                </ul>
                <p>{{ t('apiDoc.sections.introduction.note') }}</p>
              </div>
            </section>

            <section id="authentication" class="scroll-mt-24">
              <div class="mb-6 flex items-center gap-3 border-b border-zinc-200 pb-2 dark:border-zinc-800">
                <div class="rounded-lg bg-[#42b883]/10 p-2 text-[#42b883]">
                  <Key class="h-6 w-6" />
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {{ t('apiDoc.sections.authentication.title') }}
                </h2>
              </div>
              <div class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50 prose dark:prose-invert max-w-none">
                <p>{{ t('apiDoc.sections.authentication.lead') }}</p>
                <ol>
                  <li v-for="item in authenticationItems" :key="item">{{ item }}</li>
                </ol>
              </div>
            </section>

            <section id="api-standards" class="scroll-mt-24">
              <div class="mb-6 flex items-center gap-3 border-b border-zinc-200 pb-2 dark:border-zinc-800">
                <div class="rounded-lg bg-[#42b883]/10 p-2 text-[#42b883]">
                  <LinkIcon class="h-6 w-6" />
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {{ t('apiDoc.sections.apiStandards.title') }}
                </h2>
              </div>
              <div class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50 prose dark:prose-invert max-w-none">
                <ul>
                  <li>
                    {{ apiStandardsItems[0] }}
                  </li>
                  <li v-for="item in apiStandardsItems.slice(1)" :key="item">{{ item }}</li>
                </ul>
                <div class="mt-4 rounded-xl border border-[#42b883]/20 bg-[#42b883]/5 p-4 not-prose">
                  <p class="text-sm font-medium text-[#42b883]">{{ t('apiDoc.sections.apiStandards.baseUrlLabel') }}</p>
                  <p class="mt-2 break-all font-mono text-sm text-gray-700 dark:text-gray-300">{{ apiBaseUrl }}</p>
                </div>
              </div>
            </section>

            <section id="response-format" class="scroll-mt-24">
              <div class="mb-6 flex items-center gap-3 border-b border-zinc-200 pb-2 dark:border-zinc-800">
                <div class="rounded-lg bg-[#42b883]/10 p-2 text-[#42b883]">
                  <ShieldCheck class="h-6 w-6" />
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {{ t('apiDoc.sections.responseFormat.title') }}
                </h2>
              </div>
              <div class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50">
                <p class="mb-6 text-sm text-muted-foreground">
                  {{ t('apiDoc.sections.responseFormat.lead') }}
                </p>

                <div class="space-y-6">
                  <div>
                    <h4 class="mb-2 flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                      <span class="mr-2 inline-block h-2 w-2 rounded-full bg-green-500"></span>
                      {{ t('apiDoc.sections.responseFormat.successTitle') }}
                    </h4>
                    <div class="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 p-4 font-mono text-sm text-gray-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-gray-300">
                      <pre>{
  "code": 200,
  "msg": "success",
  "data": [
    // data...
  ],
  "time": 1768426432
}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 class="mb-2 flex items-center text-sm font-semibold text-red-500 dark:text-red-400">
                      <span class="mr-2 inline-block h-2 w-2 rounded-full bg-red-500"></span>
                      {{ t('apiDoc.sections.responseFormat.errorTitle') }}
                    </h4>
                    <div class="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 p-4 font-mono text-sm text-gray-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-gray-300">
                      <pre>{
  "code": 400,
  "msg": "err",
  "data": [],
  "time": 1768426915
}</pre>
                    </div>
                    <p class="mt-3 text-xs text-muted-foreground">
                      {{ t('apiDoc.sections.responseFormat.note') }}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="api-list" class="scroll-mt-24">
              <div class="mb-6 flex items-center gap-3 border-b border-zinc-200 pb-2 dark:border-zinc-800">
                <div class="rounded-lg bg-[#42b883]/10 p-2 text-[#42b883]">
                  <Globe class="h-6 w-6" />
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {{ t('apiDoc.sections.apiList.title') }}
                </h2>
              </div>
              <div class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50">
                <p class="mb-6 text-sm text-muted-foreground">
                  {{ t('apiDoc.sections.apiList.lead') }}
                </p>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div
                    v-for="item in endpointSections"
                    :key="item.id"
                    class="rounded-xl border border-zinc-200 bg-white/70 p-5 shadow-sm transition-colors hover:border-[#42b883]/40 dark:border-zinc-800 dark:bg-zinc-900/40"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <button class="text-left" @click="scrollTo(item.id)">
                          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-[#42b883]">
                            {{ item.title }}
                          </h3>
                        </button>
                        <p class="mt-2 break-all rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-[#42b883] dark:bg-zinc-800/80">
                          {{ item.method }} {{ item.path }}
                        </p>
                      </div>
                    </div>
                    <p class="mt-4 text-sm leading-6 text-muted-foreground">
                      {{ item.summary }}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section
              v-for="item in endpointSections"
              :id="item.id"
              :key="item.id"
              class="scroll-mt-24"
            >
              <div class="mb-6 flex items-center gap-3 border-b border-zinc-200 pb-2 dark:border-zinc-800">
                <div class="rounded-lg bg-[#42b883]/10 p-2 text-[#42b883]">
                  <FileJson class="h-6 w-6" />
                </div>
                <div>
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {{ item.title }}
                  </h2>
                  <p class="mt-1 font-mono text-sm text-[#42b883]">
                    {{ item.method }} {{ item.path }}
                  </p>
                </div>
              </div>

              <div class="space-y-6">
                <div class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50">
                  <div class="grid gap-4 md:grid-cols-3">
                    <div>
                      <p class="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
                      <p class="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">{{ item.summary }}</p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-wide text-muted-foreground">Auth</p>
                      <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">{{ item.auth }}</p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-wide text-muted-foreground">Content-Type</p>
                      <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">{{ item.requestType }}</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Parameters</h3>
                  <div class="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead class="bg-zinc-50 dark:bg-zinc-900/60">
                          <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Required</th>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</th>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Example</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white/60 dark:bg-black/20">
                          <tr v-for="param in item.params" :key="`${item.id}-${param.name}`">
                            <td class="px-4 py-3 font-mono text-sm text-[#42b883]">{{ param.name }}</td>
                            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ param.type }}</td>
                            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ param.required ? 'Yes' : 'No' }}</td>
                            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ param.desc }}</td>
                            <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">{{ param.example }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div class="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-black/50">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Response Example</h3>
                  <div class="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <pre class="font-mono text-sm text-gray-800 dark:text-gray-300">{{ item.successExample }}</pre>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>
