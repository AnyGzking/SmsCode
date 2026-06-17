<script setup lang="ts">
defineOptions({
  name: 'Dashboard',
})

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getDashboardApi } from '@/api/auth'
import { useCachedPageRequest } from '@/composables/useCachedPageRequest'
import { ApiStatus } from '@/lib/status'
import { usePublicStore } from '@/store/modules/public'
import { useUserStore } from '@/store/modules/user'
import { storeToRefs } from 'pinia'
import { computed, onActivated, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { VisBulletLegend, VisDonut, VisSingleContainer } from '@unovis/vue'
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Github,
  Globe2,
  KeyRound,
  MessageCircleMore,
  ReceiptText,
  Send,
  ShieldCheck,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-vue-next'

const { t, tm } = useI18n()
const userStore = useUserStore()
const publicStore = usePublicStore()
const { userInfo } = storeToRefs(userStore)

type RatioItem = {
  key: string
  name: string
  value: number
  color: string
}

type TrendItem = {
  date: string
  amount: number
  orders: number
  successRate: number
}

type DashboardSummary = {
  orders: {
    todayCount: number
    successCount: number
    failCount: number
    processingCount: number
    successRate: number
    totalAmount: number
  }
  numbers: {
    waitingCodeCount: number
    inUseCount: number
    releaseCount: number
    blacklistCount: number
  }
  projects: {
    distribution: Array<{
      name: string
      value: number
      amount: number
      successRate: number
      color: string
    }>
  }
  countries: {
    distribution: Array<{
      name: string
      value: number
      successRate: number
      color: string
    }>
  }
  trends: {
    sevenDays: Array<{
      date: string
      orderCount: number
      successCount: number
      successRate: number
      amount: number
    }>
  }
}

const { markLoaded, shouldLoad } = useCachedPageRequest('dashboard-page')

const currencyUnit = computed(() => publicStore.getConfigItem('system', 'currencyUnit', ''))
const siteName = computed(() => publicStore.getConfigItem('site', 'siteName', 'SMS Platform'))
const availableBalance = computed(() => Number(userInfo.value?.balance || 0))
const freezeBalance = computed(() => Number(userInfo.value?.freezeBalance || 0))
const totalBalance = computed(() => availableBalance.value + freezeBalance.value)
const openApiEnabled = computed(() => !!userInfo.value?.isOpenApi)
const userName = computed(() => userInfo.value?.userName || userInfo.value?.realName || '-')
const userEmail = computed(() => userInfo.value?.email || '-')
const appId = computed(() => String(userInfo.value?.userId || '-'))
const apiKey = computed(() => String(userInfo.value?.apiKey || ''))
const whiteIpList = computed(() => {
  return String(userInfo.value?.whiteIp || '')
    .replace(/，/g, ',')
    .split(/[\n,]+/)
    .map(item => item.trim())
    .filter((item, index, list) => !!item && list.indexOf(item) === index)
})
const supportContacts = computed(() => {
  const items = tm('pages.about.contacts.items') as Array<{
    key: string
    title: string
    defaultValue: string
    defaultHref: string
  }>

  return items.map((item) => {
    const current = publicStore.parsedContact[item.key] || {}
    return {
      ...item,
      value: current.value || item.defaultValue,
      href: current.href || item.defaultHref,
    }
  })
})

const createDefaultDashboardData = (): DashboardSummary => ({
  orders: {
    todayCount: 156,
    successCount: 129,
    failCount: 17,
    processingCount: 10,
    successRate: 82.69,
    totalAmount: 452.8,
  },
  numbers: {
    waitingCodeCount: 9,
    inUseCount: 28,
    releaseCount: 31,
    blacklistCount: 4,
  },
  projects: {
    distribution: [
      { name: 'Telegram', value: 38, amount: 168.2, successRate: 86.2, color: '#42b883' },
      { name: 'WhatsApp', value: 27, amount: 122.4, successRate: 83.4, color: '#0ea5e9' },
      { name: 'Google', value: 19, amount: 96.3, successRate: 79.8, color: '#f59e0b' },
      { name: 'TikTok', value: 16, amount: 65.9, successRate: 75.1, color: '#ef4444' },
    ],
  },
  countries: {
    distribution: [
      { name: 'Indonesia', value: 34, successRate: 84.1, color: '#8b5cf6' },
      { name: 'Philippines', value: 22, successRate: 82.8, color: '#06b6d4' },
      { name: 'Vietnam', value: 18, successRate: 79.6, color: '#22c55e' },
      { name: 'Brazil', value: 14, successRate: 76.4, color: '#f97316' },
      { name: 'Mexico', value: 12, successRate: 74.9, color: '#ec4899' },
    ],
  },
  trends: {
    sevenDays: [
      { date: '04-24', orderCount: 18, successCount: 14, successRate: 78, amount: 56 },
      { date: '04-25', orderCount: 24, successCount: 19, successRate: 81, amount: 72 },
      { date: '04-26', orderCount: 21, successCount: 17, successRate: 83, amount: 68 },
      { date: '04-27', orderCount: 29, successCount: 24, successRate: 84, amount: 85 },
      { date: '04-28', orderCount: 20, successCount: 16, successRate: 79, amount: 63 },
      { date: '04-29', orderCount: 16, successCount: 12, successRate: 76, amount: 51 },
      { date: '04-30', orderCount: 28, successCount: 24, successRate: 86, amount: 58 },
    ],
  },
})

const loading = ref(false)
const dashboardReady = ref(false)
const dashboardData = ref<DashboardSummary>({
  orders: {
    todayCount: 0,
    successCount: 0,
    failCount: 0,
    processingCount: 0,
    successRate: 0,
    totalAmount: 0,
  },
  numbers: {
    waitingCodeCount: 0,
    inUseCount: 0,
    releaseCount: 0,
    blacklistCount: 0,
  },
  projects: {
    distribution: [],
  },
  countries: {
    distribution: [],
  },
  trends: {
    sevenDays: [],
  },
})

const normalizeDashboardData = (payload: any): DashboardSummary => {
  const fallback = createDefaultDashboardData()

  return {
    orders: {
      todayCount: Number(payload?.orders?.todayCount || 0),
      successCount: Number(payload?.orders?.successCount || 0),
      failCount: Number(payload?.orders?.failCount || 0),
      processingCount: Number(payload?.orders?.processingCount || 0),
      successRate: Number(payload?.orders?.successRate || 0),
      totalAmount: Number(payload?.orders?.totalAmount || 0),
    },
    numbers: {
      waitingCodeCount: Number(payload?.numbers?.waitingCodeCount || 0),
      inUseCount: Number(payload?.numbers?.inUseCount || 0),
      releaseCount: Number(payload?.numbers?.releaseCount || 0),
      blacklistCount: Number(payload?.numbers?.blacklistCount || 0),
    },
    projects: {
      distribution: Array.isArray(payload?.projects?.distribution)
        ? payload.projects.distribution.map((item: any, index: number) => ({
            name: String(item?.name || `Project ${index + 1}`),
            value: Number(item?.value || 0),
            amount: Number(item?.amount || 0),
            successRate: Number(item?.successRate || 0),
            color: String(item?.color || fallback.projects.distribution[index % fallback.projects.distribution.length]?.color || '#42b883'),
          }))
        : [],
    },
    countries: {
      distribution: Array.isArray(payload?.countries?.distribution)
        ? payload.countries.distribution.map((item: any, index: number) => ({
            name: String(item?.name || `Country ${index + 1}`),
            value: Number(item?.value || 0),
            successRate: Number(item?.successRate || 0),
            color: String(item?.color || fallback.countries.distribution[index % fallback.countries.distribution.length]?.color || '#8b5cf6'),
          }))
        : [],
    },
    trends: {
      sevenDays: Array.isArray(payload?.trends?.sevenDays)
        ? payload.trends.sevenDays.map((item: any) => ({
            date: String(item?.date || ''),
            orderCount: Number(item?.orderCount || 0),
            successCount: Number(item?.successCount || 0),
            successRate: Number(item?.successRate || 0),
            amount: Number(item?.amount || 0),
          }))
        : [],
    },
  }
}

const fetchDashboard = async (force = false) => {
  if (!shouldLoad(force)) {
    return
  }

  loading.value = true
  try {
    const res = await getDashboardApi()
    if (res.code === ApiStatus.success) {
      dashboardData.value = normalizeDashboardData(res.data)
      dashboardReady.value = true
      markLoaded()
    }
  } finally {
    loading.value = false
  }
}

const formatAmount = (value: number) => `${currencyUnit.value}${Number(value || 0).toFixed(4)}`
const formatPercent = (value: number) => `${Number(value || 0).toFixed(2)}%`
const maskApiKey = (value: string) => {
  if (!value) return '-'
  if (value.length <= 10) return value
  return `${value.slice(0, 6)}••••${value.slice(-4)}`
}

const balanceRatioData = computed<RatioItem[]>(() => {
  const total = Math.max(totalBalance.value, 1)
  return [
    {
      key: 'available',
      name: t('dashboard_cards.balanceRatio.available'),
      value: Number(((availableBalance.value / total) * 100).toFixed(2)),
      color: '#42b883',
    },
    {
      key: 'freeze',
      name: t('dashboard_cards.balanceRatio.freeze'),
      value: Number(((freezeBalance.value / total) * 100).toFixed(2)),
      color: '#f59e0b',
    },
  ]
})

const orderStatusRatioData = computed<RatioItem[]>(() => {
  const orders = dashboardData.value.orders
  const total = Math.max(orders.todayCount, 1)
  return [
    {
      key: 'success',
      name: t('dashboard_cards.orderRatio.success'),
      value: Number(((orders.successCount / total) * 100).toFixed(2)),
      color: '#22c55e',
    },
    {
      key: 'fail',
      name: t('dashboard_cards.orderRatio.fail'),
      value: Number(((orders.failCount / total) * 100).toFixed(2)),
      color: '#ef4444',
    },
    {
      key: 'processing',
      name: t('dashboard_cards.orderRatio.processing'),
      value: Number(((orders.processingCount / total) * 100).toFixed(2)),
      color: '#0ea5e9',
    },
  ]
})

const projectRatioData = computed<RatioItem[]>(() => {
  const total = dashboardData.value.projects.distribution.reduce((sum, item) => sum + item.value, 0) || 1
  return dashboardData.value.projects.distribution.map(item => ({
    key: item.name,
    name: item.name,
    value: Number(((item.value / total) * 100).toFixed(2)),
    color: item.color,
  }))
})

const countryRatioData = computed<RatioItem[]>(() => {
  const total = dashboardData.value.countries.distribution.reduce((sum, item) => sum + item.value, 0) || 1
  return dashboardData.value.countries.distribution.map(item => ({
    key: item.name,
    name: item.name,
    value: Number(((item.value / total) * 100).toFixed(2)),
    color: item.color,
  }))
})

const trendBars = computed(() => {
  const trends = dashboardData.value.trends.sevenDays.map(item => ({
    date: item.date,
    amount: item.amount,
    orders: item.orderCount,
    successRate: item.successRate,
  })) as TrendItem[]
  const max = Math.max(...trends.map(item => item.amount), 1)
  return trends.map(item => ({
    ...item,
    height: `${Math.max(18, (item.amount / max) * 100)}%`,
  }))
})

const overviewCards = computed(() => [
  {
    key: 'availableBalance',
    title: t('dashboard_cards.overview.availableBalance'),
    value: formatAmount(availableBalance.value),
    description: t('dashboard_cards.overview.availableBalanceDesc'),
    icon: Wallet,
    accent: 'text-emerald-600 dark:text-emerald-300',
  },
  {
    key: 'todayAmount',
    title: t('dashboard_cards.overview.todayAmount'),
    value: formatAmount(dashboardData.value.orders.totalAmount),
    description: t('dashboard_cards.overview.todayAmountDesc'),
    icon: ReceiptText,
    accent: 'text-sky-600 dark:text-sky-300',
  },
  {
    key: 'successRate',
    title: t('dashboard_cards.overview.successRate'),
    value: formatPercent(dashboardData.value.orders.successRate),
    description: t('dashboard_cards.overview.successRateDesc'),
    icon: TrendingUp,
    accent: 'text-violet-600 dark:text-violet-300',
  },
  {
    key: 'waitingCode',
    title: t('dashboard_cards.overview.waitingCodeCount'),
    value: String(dashboardData.value.numbers.waitingCodeCount),
    description: t('dashboard_cards.overview.waitingCodeCountDesc'),
    icon: Clock3,
    accent: 'text-amber-600 dark:text-amber-300',
  },
])

const quickStats = computed(() => [
  {
    key: 'whiteIpCount',
    label: t('dashboard_cards.quickStats.whiteIpCount'),
    value: String(whiteIpList.value.length),
  },
  {
    key: 'defaultCurrency',
    label: t('dashboard_cards.quickStats.defaultCurrency'),
    value: currencyUnit.value || '-',
  },
  {
    key: 'supportTelegram',
    label: t('dashboard_cards.quickStats.supportTelegram'),
    value: supportContacts.value.find(item => item.key === 'telegram')?.value || '-',
  },
  {
    key: 'siteName',
    label: t('dashboard_cards.quickStats.siteName'),
    value: siteName.value,
  },
  {
    key: 'todayOrders',
    label: t('dashboard_cards.quickStats.todayOrders'),
    value: String(dashboardData.value.orders.todayCount),
  },
  {
    key: 'inUseCount',
    label: t('dashboard_cards.quickStats.inUseCount'),
    value: String(dashboardData.value.numbers.inUseCount),
  },
])

const accountMetrics = computed(() => [
  {
    key: 'openApi',
    label: t('dashboard_cards.accountMetrics.openApi'),
    value: openApiEnabled.value ? t('dashboard_cards.status.enabled') : t('dashboard_cards.status.disabled'),
    icon: KeyRound,
  },
  {
    key: 'security',
    label: t('dashboard_cards.accountMetrics.security'),
    value: whiteIpList.value.length ? t('dashboard_cards.accountMetrics.whitelistReady') : t('dashboard_cards.accountMetrics.whitelistMissing'),
    icon: ShieldCheck,
  },
  {
    key: 'billing',
    label: t('dashboard_cards.accountMetrics.billing'),
    value: formatAmount(totalBalance.value),
    icon: Wallet,
  },
  {
    key: 'support',
    label: t('dashboard_cards.accountMetrics.support'),
    value: supportContacts.value.find(item => item.key === 'telegram')?.value || '-',
    icon: Globe2,
  },
])

const rankingProjects = computed(() => dashboardData.value.projects.distribution)
const rankingCountries = computed(() => dashboardData.value.countries.distribution)
// const backendFields = computed(
//   () =>
//     tm('dashboard_cards.backend.fields') as Array<{
//       name: string
//       type: string
//       desc: string
//     }>,
// )

const donutValue = (d: RatioItem) => d.value
const donutColor = (d: RatioItem) => d.color
const legendItems = (items: RatioItem[]) => items.map(item => ({ name: `${item.name} ${formatPercent(item.value)}`, color: item.color }))

onMounted(async () => {
  await fetchDashboard()
})

onActivated(() => {
  dashboardReady.value = true
})
</script>

<template>
  <div v-if="loading && !dashboardReady" class="w-full min-w-0 space-y-6">
    <Card>
      <CardHeader class="space-y-4">
        <div class="space-y-3">
          <div class="h-6 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div class="h-8 w-72 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div class="h-4 w-full max-w-3xl animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div class="h-4 w-full max-w-2xl animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </CardHeader>
    </Card>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-4">
      <Card v-for="item in 4" :key="`dashboard-overview-skeleton-${item}`">
        <CardHeader class="space-y-3">
          <div class="h-4 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div class="h-8 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </CardHeader>
        <CardContent>
          <div class="h-4 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card v-for="item in 4" :key="`dashboard-chart-skeleton-${item}`">
        <CardHeader class="space-y-3">
          <div class="h-5 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div class="h-4 w-full max-w-md animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </CardHeader>
        <CardContent class="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div class="mx-auto h-[180px] w-[180px] animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div class="space-y-3">
            <div v-for="line in 4" :key="line" class="h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <Card>
        <CardHeader class="space-y-3">
          <div class="h-5 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div class="h-4 w-full max-w-md animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="h-56 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div v-for="line in 5" :key="`trend-${line}`" class="h-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="space-y-3">
          <div class="h-5 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div class="h-4 w-full max-w-md animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div v-for="line in 6" :key="`metric-${line}`" class="h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <div v-else class="w-full min-w-0 space-y-6">
    <Card>
      <CardHeader class="space-y-4">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <Badge variant="outline" class="bg-primary/5 text-primary">
                {{ t('navigation.dashboard') }}
              </Badge>
              <Badge
                variant="outline"
                :class="openApiEnabled ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300'"
              >
                {{ openApiEnabled ? t('dashboard_cards.status.openApiEnabled') : t('dashboard_cards.status.openApiDisabled') }}
              </Badge>
            </div>
            <CardTitle class="text-2xl md:text-3xl">{{ t('dashboard_cards.hero.title') }}</CardTitle>
            <CardDescription class="max-w-4xl text-sm leading-6">
              {{ t('dashboard_cards.hero.description') }}
            </CardDescription>
          </div>

          <div class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[420px]">
            <div class="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.account.userName') }}</div>
              <div class="mt-2 truncate text-sm font-semibold">{{ userName }}</div>
            </div>
            <div class="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.account.appId') }}</div>
              <div class="mt-2 truncate text-sm font-semibold">{{ appId }}</div>
            </div>
            <div class="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:col-span-2">
              <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.account.apiKey') }}</div>
              <div class="mt-2 break-all text-sm font-semibold">{{ maskApiKey(apiKey) }}</div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-4">
      <Card v-for="item in overviewCards" :key="item.key">
        <CardHeader class="flex flex-row items-start justify-between space-y-0 pb-3">
          <div class="space-y-1">
            <CardTitle class="text-sm font-medium text-muted-foreground">{{ item.title }}</CardTitle>
            <div class="text-3xl font-bold break-all">{{ item.value }}</div>
          </div>
          <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/60">
            <component :is="item.icon" class="h-5 w-5" :class="item.accent" />
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-xs leading-5 text-muted-foreground">{{ item.description }}</p>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card class="min-w-0">
          <CardHeader>
            <CardTitle>{{ t('dashboard_cards.balanceRatio.title') }}</CardTitle>
            <CardDescription>{{ t('dashboard_cards.balanceRatio.description') }}</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] 2xl:grid-cols-[160px_minmax(0,1fr)] lg:items-center">
            <div class="flex justify-center">
              <VisSingleContainer :data="balanceRatioData" class="h-[180px] w-[180px] 2xl:h-[160px] 2xl:w-[160px]">
                <VisDonut
                  :value="donutValue"
                  :color="donutColor"
                  :show-empty-segments="true"
                  :pad-angle="0.03"
                  :corner-radius="6"
                />
              </VisSingleContainer>
            </div>
            <div class="space-y-4">
              <VisBulletLegend :items="legendItems(balanceRatioData)" />
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.balanceRatio.available') }}</div>
                  <div class="mt-2 text-lg font-semibold">{{ formatAmount(availableBalance) }}</div>
                </div>
                <div class="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.balanceRatio.freeze') }}</div>
                  <div class="mt-2 text-lg font-semibold">{{ formatAmount(freezeBalance) }}</div>
                </div>
              </div>
            </div>
          </CardContent>
      </Card>

      <Card class="min-w-0">
          <CardHeader>
            <CardTitle>{{ t('dashboard_cards.orderRatio.title') }}</CardTitle>
            <CardDescription>{{ t('dashboard_cards.orderRatio.description') }}</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] 2xl:grid-cols-[160px_minmax(0,1fr)] lg:items-center">
            <div class="flex justify-center">
              <VisSingleContainer :data="orderStatusRatioData" class="h-[180px] w-[180px] 2xl:h-[160px] 2xl:w-[160px]">
                <VisDonut
                  :value="donutValue"
                  :color="donutColor"
                  :show-empty-segments="true"
                  :pad-angle="0.03"
                  :corner-radius="6"
                />
              </VisSingleContainer>
            </div>
            <div class="space-y-4">
              <VisBulletLegend :items="legendItems(orderStatusRatioData)" />
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 2xl:grid-cols-1">
                <div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.orderRatio.success') }}</div>
                  <div class="mt-2 text-lg font-semibold">{{ dashboardData.orders.successCount }}</div>
                </div>
                <div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.orderRatio.fail') }}</div>
                  <div class="mt-2 text-lg font-semibold">{{ dashboardData.orders.failCount }}</div>
                </div>
                <div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.orderRatio.processing') }}</div>
                  <div class="mt-2 text-lg font-semibold">{{ dashboardData.orders.processingCount }}</div>
                </div>
              </div>
            </div>
          </CardContent>
      </Card>

      <Card class="min-w-0">
          <CardHeader>
            <CardTitle>{{ t('dashboard_cards.projectRatio.title') }}</CardTitle>
            <CardDescription>{{ t('dashboard_cards.projectRatio.description') }}</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] 2xl:grid-cols-[160px_minmax(0,1fr)] lg:items-center">
            <div class="flex justify-center">
              <VisSingleContainer :data="projectRatioData" class="h-[180px] w-[180px] 2xl:h-[160px] 2xl:w-[160px]">
                <VisDonut
                  :value="donutValue"
                  :color="donutColor"
                  :show-empty-segments="true"
                  :pad-angle="0.03"
                  :corner-radius="6"
                />
              </VisSingleContainer>
            </div>
            <div class="space-y-4">
              <VisBulletLegend :items="legendItems(projectRatioData)" />
              <div class="space-y-3">
                <div
                  v-for="project in rankingProjects"
                  :key="project.name"
                  class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <div class="text-sm font-semibold">{{ project.name }}</div>
                      <div class="mt-1 text-xs text-muted-foreground">{{ t('dashboard_cards.projectRatio.successRate') }} {{ formatPercent(project.successRate) }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-semibold">{{ project.value }}%</div>
                      <div class="mt-1 text-xs text-muted-foreground">{{ formatAmount(project.amount) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
      </Card>

      <Card class="min-w-0">
          <CardHeader>
            <CardTitle>{{ t('dashboard_cards.countryRatio.title') }}</CardTitle>
            <CardDescription>{{ t('dashboard_cards.countryRatio.description') }}</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] 2xl:grid-cols-[160px_minmax(0,1fr)] lg:items-center">
            <div class="flex justify-center">
              <VisSingleContainer :data="countryRatioData" class="h-[180px] w-[180px] 2xl:h-[160px] 2xl:w-[160px]">
                <VisDonut
                  :value="donutValue"
                  :color="donutColor"
                  :show-empty-segments="true"
                  :pad-angle="0.03"
                  :corner-radius="6"
                />
              </VisSingleContainer>
            </div>
            <div class="space-y-3">
              <VisBulletLegend :items="legendItems(countryRatioData)" />
              <div
                v-for="country in rankingCountries"
                :key="country.name"
                class="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div>
                  <div class="text-sm font-semibold">{{ country.name }}</div>
                  <div class="mt-1 text-xs text-muted-foreground">{{ t('dashboard_cards.countryRatio.successRate') }} {{ formatPercent(country.successRate) }}</div>
                </div>
                <div class="text-sm font-semibold">{{ country.value }}%</div>
              </div>
            </div>
          </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{{ t('dashboard_cards.trend.title') }}</CardTitle>
          <CardDescription>{{ t('dashboard_cards.trend.description') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.trend.totalOrders') }}</div>
              <div class="mt-2 flex items-center gap-2 text-lg font-semibold">
                <BarChart3 class="h-4 w-4 text-primary" />
                {{ dashboardData.orders.todayCount }}
              </div>
            </div>
            <div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.trend.successRate') }}</div>
              <div class="mt-2 flex items-center gap-2 text-lg font-semibold">
                <CheckCircle2 class="h-4 w-4 text-emerald-500" />
                {{ formatPercent(dashboardData.orders.successRate) }}
              </div>
            </div>
            <div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.trend.failCount') }}</div>
              <div class="mt-2 flex items-center gap-2 text-lg font-semibold">
                <XCircle class="h-4 w-4 text-red-500" />
                {{ dashboardData.orders.failCount }}
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div class="flex h-56 items-end gap-3">
              <div
                v-for="item in trendBars"
                :key="item.date"
                class="flex min-w-0 flex-1 flex-col items-center gap-3"
              >
                <div class="text-xs font-medium text-muted-foreground">{{ formatAmount(item.amount) }}</div>
                <div class="flex h-40 w-full items-end">
                  <div
                    class="w-full rounded-t-xl bg-[linear-gradient(180deg,#42b883_0%,#0ea5e9_100%)] transition-all"
                    :style="{ height: item.height }"
                  />
                </div>
                <div class="text-xs text-muted-foreground">{{ item.date }}</div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="text-sm font-semibold">{{ t('dashboard_cards.trend.latestWindow') }}</div>
            <div
              v-for="item in trendBars"
              :key="`${item.date}-detail`"
              class="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div class="text-sm font-medium">{{ item.date }}</div>
              <div class="text-xs text-muted-foreground">{{ item.orders }} {{ t('dashboard_cards.trend.ordersUnit') }}</div>
              <div class="text-xs text-muted-foreground">{{ formatPercent(item.successRate) }}</div>
              <div class="text-sm font-semibold">{{ formatAmount(item.amount) }}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{{ t('dashboard_cards.account.title') }}</CardTitle>
          <CardDescription>{{ t('dashboard_cards.account.description') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="rounded-xl border border-zinc-200 bg-background p-4 dark:border-zinc-800">
            <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.account.email') }}</div>
            <div class="mt-2 break-all text-sm font-semibold">{{ userEmail }}</div>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              v-for="item in quickStats"
              :key="item.key"
              class="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <div class="text-xs text-muted-foreground">{{ item.label }}</div>
              <div class="mt-2 break-all text-sm font-semibold">{{ item.value }}</div>
            </div>
          </div>

          <Separator />

          <div class="space-y-3">
            <div class="text-sm font-semibold">{{ t('dashboard_cards.accountMetrics.title') }}</div>
            <div
              v-for="item in accountMetrics"
              :key="item.key"
              class="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <component :is="item.icon" class="h-5 w-5 text-primary" />
              <div class="min-w-0 flex-1">
                <div class="text-xs text-muted-foreground">{{ item.label }}</div>
                <div class="mt-1 break-all text-sm font-semibold">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ t('dashboard_cards.support.title') }}</CardTitle>
        <CardDescription>{{ t('dashboard_cards.support.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <Globe2 class="h-5 w-5 text-primary" />
          <div class="min-w-0">
            <div class="text-xs text-muted-foreground">{{ t('dashboard_cards.support.siteName') }}</div>
            <div class="truncate text-sm font-semibold">{{ siteName }}</div>
          </div>
        </div>
        <a
          v-for="item in supportContacts"
          :key="item.key"
          :href="item.href"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-[#42b883]/40 dark:border-zinc-800"
        >
          <component
            :is="item.key === 'telegram' ? Send : item.key === 'github' ? Github : MessageCircleMore"
            class="h-5 w-5 text-primary"
          />
          <div class="min-w-0">
            <div class="text-xs text-muted-foreground">{{ item.title }}</div>
            <div class="break-all text-sm font-semibold">{{ item.value }}</div>
          </div>
        </a>
      </CardContent>
    </Card>
  </div>
</template>
