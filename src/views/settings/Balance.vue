<script setup lang="ts">
defineOptions({ name: 'SettingsBalance' })

import SettingsLayout from '@/components/settings/Layout.vue'
import { Button } from '@/components/ui/button'
import {
  CalendarDateTime,
  getLocalTimeZone,
  parseDateTime,
  today,
} from '@internationalized/date'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { balanceChangeListApi, createPayOrderApi, getOrderPayStatusApi } from '@/api/auth'
import { usePublicStore } from '@/store/modules/public'
import { useUserStore } from '@/store/modules/user'
import { useCachedPageRequest } from '@/composables/useCachedPageRequest'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onActivated, onMounted, reactive, ref } from 'vue'
import { ApiStatus } from '@/lib/status'
import { toast } from '@/components/ui/toast'
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import {
  type DateRange,
  DateRangePickerAnchor,
  DateRangePickerArrow,
  DateRangePickerCalendar,
  DateRangePickerCell,
  DateRangePickerCellTrigger,
  DateRangePickerContent,
  DateRangePickerField,
  DateRangePickerGrid,
  DateRangePickerGridBody,
  DateRangePickerGridHead,
  DateRangePickerGridRow,
  DateRangePickerHeadCell,
  DateRangePickerHeader,
  DateRangePickerHeading,
  DateRangePickerNext,
  DateRangePickerPrev,
  DateRangePickerRoot,
  DateRangePickerTrigger,
} from 'radix-vue'

const { t } = useI18n()
const userStore = useUserStore()
const publicStore = usePublicStore()
const { markLoaded, shouldLoad } = useCachedPageRequest('balance-page')
const { userInfo } = storeToRefs(userStore)

const loading = ref(false)
const rechargeAmount = ref('50')
const jumpPage = ref('1')
const presetAmounts = [5, 10, 20, 50, 100, 200, 500]

const createDefaultDateTime = () => {
  const base = today(getLocalTimeZone())
  return new CalendarDateTime(base.year, base.month, base.day, 0, 0, 0)
}

const dateRange = ref<any>({
  start: createDefaultDateTime(),
  end: createDefaultDateTime(),
})

const query = reactive({
  current: 1,
  size: 10,
  orderNo: '',
  remark: '',
  source: '',
  changeType: 'all',
  startTime: '',
  endTime: '',
})

const recordData = ref<{
  list: any[]
  total: number
  type1Amount?: string
  type2Amount?: string
  type3Amount?: string
  type4Amount?: string
  type5Amount?: string
  type6Amount?: string
  type7Amount?: string
  type8Amount?: string
}>({
  list: [],
  total: 0,
  type1Amount: '0',
  type2Amount: '0',
  type3Amount: '0',
  type4Amount: '0',
  type5Amount: '0',
  type6Amount: '0',
  type7Amount: '0',
  type8Amount: '0',
})

const changeTypeOptions = computed(() => {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => ({
    label: t(`pages.balancePage.records.changeTypeOptions.${value}`),
    value: String(value),
  }))
})

const typeAmountStats = computed(() => {
  return [1, 2, 3, 4, 5, 6, 7, 8].map((index) => ({
    key: `type${index}`,
    label: t(`pages.balancePage.records.typeAmountLabels.type${index}`),
    value: formatAmount(recordData.value[`type${index}Amount` as keyof typeof recordData.value] as string || '0'),
  }))
})

const currencyUnit = computed(() => publicStore.getConfigItem('system', 'currencyUnit', ''))
const handlingFee = computed(() => Number(publicStore.getConfigItem('system', 'handlingFee', '0')) || 0)
const handlingFeeText = computed(() => `${handlingFee.value}%`)
const rechargeTip = computed(() => {
  return `${t('pages.balancePage.recharge.tip')} ${handlingFeeText.value}`
})
const balance = computed(() => Number(userInfo.value?.balance || 0))
const freezeBalance = computed(() => Number(userInfo.value?.freezeBalance || 0))
const totalBalance = computed(() => balance.value + freezeBalance.value)
const totalPages = computed(() => Math.max(1, Math.ceil((recordData.value.total || 0) / query.size)))

const datePickerLocale = computed(() => {
  return typeof navigator !== 'undefined' && navigator.language
    ? navigator.language
    : 'zh-CN'
})

const formatAmount = (value: string | number) => {
  return `${currencyUnit.value}${Number(value || 0).toFixed(4)}`
}

const formatDateOnlyValue = (value?: CalendarDateTime) => {
  if (!value) return ''
  const year = String(value.year).padStart(4, '0')
  const month = String(value.month).padStart(2, '0')
  const day = String(value.day).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateTimeValue = (value?: string) => {
  const cleanValue = String(value || '').trim()
  if (!cleanValue) return undefined
  const normalized = cleanValue.replace(' ', 'T')
  try {
    return parseDateTime(normalized.length === 16 ? `${normalized}:00` : normalized)
  } catch {
    return undefined
  }
}

const syncQueryFromDateRange = () => {
  const start = dateRange.value.start as CalendarDateTime | undefined
  const end = dateRange.value.end as CalendarDateTime | undefined
  const startDate = formatDateOnlyValue(start)
  const endDate = formatDateOnlyValue(end)

  query.startTime = startDate ? `${startDate} 00:00:00` : ''
  query.endTime = endDate ? `${endDate} 23:59:59` : ''
}

const syncDateRangeFromQuery = () => {
  dateRange.value = {
    start: parseDateTimeValue(query.startTime) || createDefaultDateTime(),
    end: parseDateTimeValue(query.endTime) || createDefaultDateTime(),
  }
}

const dateRangeLabel = computed(() => {
  if (!query.startTime || !query.endTime) {
    return t('pages.balancePage.records.filters.selectTimeRange')
  }

  return `${query.startTime.slice(0, 10)} ~ ${query.endTime.slice(0, 10)}`
})

const fetchBalanceRecords = async () => {
  loading.value = true
  try {
    const payload = {
      ...query,
      changeType: query.changeType === 'all' ? '' : query.changeType,
      daterange: query.startTime && query.endTime ? [query.startTime, query.endTime] : [],
    }
    const res = await balanceChangeListApi(payload)
    if (res.code === ApiStatus.success) {
      recordData.value = {
        list: res.data.list || [],
        total: res.data.total || 0,
        type1Amount: res.data.type1Amount || '0',
        type2Amount: res.data.type2Amount || '0',
        type3Amount: res.data.type3Amount || '0',
        type4Amount: res.data.type4Amount || '0',
        type5Amount: res.data.type5Amount || '0',
        type6Amount: res.data.type6Amount || '0',
        type7Amount: res.data.type7Amount || '0',
        type8Amount: res.data.type8Amount || '0',
      }
      jumpPage.value = String(query.current)
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  syncQueryFromDateRange()
  query.current = 1
  fetchBalanceRecords()
}

const handleReset = () => {
  query.orderNo = ''
  query.remark = ''
  query.source = ''
  query.changeType = 'all'
  query.startTime = ''
  query.endTime = ''
  dateRange.value = {
    start: createDefaultDateTime(),
    end: createDefaultDateTime(),
  }
  query.current = 1
  jumpPage.value = '1'
  fetchBalanceRecords()
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value || page === query.current) return
  query.current = page
  fetchBalanceRecords()
}

const handleJumpPage = () => {
  const page = Number(jumpPage.value)
  if (!Number.isInteger(page)) return
  handlePageChange(page)
}

const handleDateRangeUpdate = (value: DateRange) => {
  dateRange.value = value
  syncQueryFromDateRange()
}

const columnHelper = createColumnHelper<any>()
const columns = computed(() => [
  columnHelper.accessor('createTime', {
    header: () => t('pages.balancePage.records.table.createTime'),
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('source', {
    header: () => t('pages.balancePage.records.table.source'),
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('remark', {
    header: () => t('pages.balancePage.records.table.remark'),
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('orderNo', {
    header: () => t('pages.balancePage.records.table.orderNo'),
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('changeAmount', {
    header: () => t('pages.balancePage.records.table.changeAmount'),
    cell: info => formatAmount(info.getValue()),
  }),
  columnHelper.accessor('beforeBalance', {
    header: () => t('pages.balancePage.records.table.beforeBalance'),
    cell: info => formatAmount(info.getValue()),
  }),
  columnHelper.accessor('afterBalance', {
    header: () => t('pages.balancePage.records.table.afterBalance'),
    cell: info => formatAmount(info.getValue()),
  }),
])

const table = useVueTable({
  get data() {
    return recordData.value.list
  },
  get columns() {
    return columns.value
  },
  getCoreRowModel: getCoreRowModel(),
})

//支付相关
const payLoading = ref(false)
const payOrderIds = ref<string[]>([])

const clearPayOrderId = (orderId?: string) => {
  if (!orderId) return
  payOrderIds.value = payOrderIds.value.filter((item) => item !== orderId)
}

const refreshBalanceAndClearOrder = async (orderId?: string) => {
  clearPayOrderId(orderId)
  await userStore.refreshUserInfo()
}

const startPayOrderPolling = (orderId: string) => {
  const run = async () => {
    try {
      const res = await getOrderPayStatusApi({ order_id: orderId })
      if (res.code === ApiStatus.success && Number(res.data?.status) === 2) {
        window.clearInterval(timer)
        await refreshBalanceAndClearOrder(orderId)
      }
    } catch {
      // ignore and continue polling
    }
  }

  const timer = window.setInterval(run, 5000)
  void run()
}

const goPay = async () => {
  const amount = Number(rechargeAmount.value)
  if (!Number.isFinite(amount) || amount <= 0) {
    toast({
      title: t('common.error'),
      description: t('pages.balancePage.recharge.placeholder'),
      variant: 'destructive',
    })
    return
  }

  payLoading.value = true
  try {
    const res = await createPayOrderApi({ amount })
    if (res.code === ApiStatus.success) {
      const paymentUrl = res.data?.payment_url || res.data?.paymentUrl || res.payment_url || res.paymentUrl
      const orderId = String(res.data?.order_id || res.data?.orderId || '')
      if (orderId) {
        payOrderIds.value = Array.from(new Set([...payOrderIds.value, orderId]))
      }
      if (paymentUrl) {
        window.open(paymentUrl, '_blank', 'noopener,noreferrer')
      }
      toast({
        title: t('common.success'),
        description: res.msg || t('pages.balancePage.recharge.action'),
      })
      if (orderId) {
        startPayOrderPolling(orderId)
      }
      return
    }

    toast({
      title: t('common.error'),
      description: res.msg || t('common.operationFailed'),
      variant: 'destructive',
    })
  } catch (error: unknown) {
    toast({
      title: t('common.error'),
      description: error instanceof Error ? error.message : t('common.operationFailed'),
      variant: 'destructive',
    })
  } finally {
    payLoading.value = false
  }
}

onMounted(() => {
  syncDateRangeFromQuery()
  if (shouldLoad()) {
    fetchBalanceRecords().finally(() => {
      markLoaded()
    })
  }
})

onActivated(async () => {
  syncDateRangeFromQuery()
  await nextTick()
})
</script>

<template>
  <SettingsLayout>
    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{{ t('pages.balancePage.title') }}</CardTitle>
          <CardDescription>{{ t('pages.balancePage.description') }}</CardDescription>
        </CardHeader>
      </Card>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('pages.balancePage.summary.balance') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold break-all">{{ formatAmount(balance) }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{{ t('pages.balancePage.summary.freezeBalance') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold break-all">{{ formatAmount(freezeBalance) }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{{ t('pages.balancePage.summary.totalBalance') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold break-all">{{ formatAmount(totalBalance) }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{{ t('pages.balancePage.summary.freezeAmount') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold break-all">{{ formatAmount(recordData.type6Amount || 0) }}</p>
            <p class="mt-2 text-sm text-muted-foreground break-all">{{ t('pages.balancePage.summary.unfreezeAmount') }}：{{ formatAmount(recordData.type7Amount || 0) }}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{{ t('pages.balancePage.recharge.title') }}</CardTitle>
          <CardDescription>{{ t('pages.balancePage.recharge.description') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>{{ t('pages.balancePage.recharge.preset') }}</Label>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="amount in presetAmounts"
                :key="amount"
                type="button"
                variant="outline"
                @click="rechargeAmount = String(amount)"
              >
                {{ currencyUnit }}{{ amount }}
              </Button>
            </div>
          </div>

          <div class="space-y-2">
            <Label>{{ t('pages.balancePage.recharge.custom') }}</Label>
            <Input v-model="rechargeAmount" :placeholder="t('pages.balancePage.recharge.placeholder')" />
          </div>

              <Button class="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto" :disabled="payLoading" @click="goPay">
            <span v-if="payLoading">{{ t('pages.balancePage.recharge.loading') }}</span>
            <span v-else>{{ t('pages.balancePage.recharge.action') }}</span>
          </Button>
          <p class="text-sm text-muted-foreground">{{ rechargeTip }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="space-y-4">
          <CardTitle>{{ t('pages.balancePage.records.title') }}</CardTitle>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
            <div
              v-for="stat in typeAmountStats"
              :key="stat.key"
              class="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <div class="text-xs text-muted-foreground">{{ stat.label }}</div>
              <div class="mt-2 text-base font-semibold break-all">{{ stat.value }}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div class="space-y-2">
              <Label>{{ t('pages.balancePage.records.filters.orderNo') }}</Label>
              <Input v-model="query.orderNo" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('pages.balancePage.records.filters.remark') }}</Label>
              <Input v-model="query.remark" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('pages.balancePage.records.filters.source') }}</Label>
              <Input v-model="query.source" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('pages.balancePage.records.filters.changeType') }}</Label>
              <Select v-model="query.changeType">
                <SelectTrigger>
                  <SelectValue :placeholder="t('pages.balancePage.records.filters.changeType')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {{ t('pages.balancePage.records.changeTypeOptions.all') }}
                  </SelectItem>
                  <SelectItem v-for="option in changeTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div class="space-y-2 w-full xl:max-w-[435px]">
              <Label>{{ t('pages.balancePage.records.filters.timeRange') }}</Label>
              <DateRangePickerRoot
                v-model="dateRange"
                :locale="datePickerLocale"
                granularity="second"
                :hour-cycle="24"
                :number-of-months="2"
                @update:model-value="handleDateRangeUpdate"
              >
                <DateRangePickerField as-child>
                  <Button variant="outline" class="w-full justify-between text-left font-normal">
                    <span class="truncate">{{ dateRangeLabel }}</span>
                    <DateRangePickerTrigger as-child>
                      <span class="ml-2 inline-flex shrink-0 text-muted-foreground">
                        <CalendarIcon class="h-4 w-4" />
                      </span>
                    </DateRangePickerTrigger>
                  </Button>
                </DateRangePickerField>

                <DateRangePickerAnchor />

                <DateRangePickerContent
                  class="z-[80] w-auto rounded-xl border border-zinc-200 bg-background p-4 shadow-2xl dark:border-zinc-800"
                  align="start"
                  :side-offset="8"
                >
                  <DateRangePickerArrow />
                  <div class="flex flex-col gap-4 xl:flex-row">
                    <DateRangePickerCalendar
                      v-slot="{ weekDays, grid }"
                      class="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-[#131313]"
                    >
                      <DateRangePickerHeader class="mb-3 flex items-center justify-between gap-2">
                        <DateRangePickerPrev as-child>
                          <Button variant="outline" size="icon" class="h-8 w-8">
                            <ChevronLeft class="h-4 w-4" />
                          </Button>
                        </DateRangePickerPrev>
                        <DateRangePickerHeading class="text-sm font-medium" />
                        <DateRangePickerNext as-child>
                          <Button variant="outline" size="icon" class="h-8 w-8">
                            <ChevronRight class="h-4 w-4" />
                          </Button>
                        </DateRangePickerNext>
                      </DateRangePickerHeader>

                      <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <DateRangePickerGrid
                          v-for="month in grid"
                          :key="month.value.toString()"
                          class="w-full border-collapse select-none space-y-1"
                        >
                          <DateRangePickerGridHead>
                            <DateRangePickerGridRow class="mb-1 grid grid-cols-7 gap-1">
                              <DateRangePickerHeadCell
                                v-for="weekDay in weekDays"
                                :key="weekDay"
                                class="h-8 text-xs font-normal text-muted-foreground"
                              >
                                {{ weekDay }}
                              </DateRangePickerHeadCell>
                            </DateRangePickerGridRow>
                          </DateRangePickerGridHead>
                          <DateRangePickerGridBody>
                            <DateRangePickerGridRow
                              v-for="(weekDates, index) in month.rows"
                              :key="`weekDate-${index}`"
                              class="grid grid-cols-7 gap-1"
                            >
                              <DateRangePickerCell
                                v-for="weekDate in weekDates"
                                :key="weekDate.toString()"
                                :date="weekDate"
                              >
                                <DateRangePickerCellTrigger
                                  :day="weekDate"
                                  :month="month.value"
                                  class="flex h-9 w-9 items-center justify-center rounded-md text-sm outline-none transition-colors hover:bg-muted data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[outside-view]:text-muted-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-30"
                                />
                              </DateRangePickerCell>
                            </DateRangePickerGridRow>
                          </DateRangePickerGridBody>
                        </DateRangePickerGrid>
                      </div>
                    </DateRangePickerCalendar>
                  </div>
                </DateRangePickerContent>
              </DateRangePickerRoot>
            </div>
            <div class="flex flex-wrap items-end gap-2">
              <Button @click="handleSearch">{{ t('pages.balancePage.records.filters.search') }}</Button>
              <Button variant="outline" @click="handleReset">{{ t('pages.balancePage.records.filters.reset') }}</Button>
            </div>
          </div>

          <div class="relative rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-[320px]">
            <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span>{{ t('common.loading') }}</span>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full min-w-[960px] text-sm">
                <thead class="bg-zinc-50 dark:bg-zinc-900/60">
                  <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="border-b border-zinc-200 dark:border-zinc-800">
                    <th
                      v-for="header in headerGroup.headers"
                      :key="header.id"
                      class="px-4 py-3 text-left font-medium whitespace-nowrap"
                    >
                      <FlexRender
                        v-if="!header.isPlaceholder"
                        :render="header.column.columnDef.header"
                        :props="header.getContext()"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!recordData.list.length && !loading">
                    <td :colspan="columns.length" class="px-4 py-10 text-center text-muted-foreground">
                      {{ t('pages.balancePage.records.empty') }}
                    </td>
                  </tr>
                  <tr
                    v-for="row in table.getRowModel().rows"
                    :key="row.id"
                    class="border-b border-zinc-200 dark:border-zinc-800"
                  >
                    <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-4 py-3 align-top whitespace-nowrap">
                      <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-col gap-3 pt-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
            <span>{{ query.current }} / {{ totalPages }} · {{ t('pages.balancePage.summary.totalRecords') }} {{ recordData.total }}</span>
            <div class="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" :disabled="query.current <= 1 || loading" @click="handlePageChange(query.current - 1)">
                {{ t('pages.balancePage.records.pagination.prev') }}
              </Button>
              <Button variant="outline" size="sm" :disabled="query.current >= totalPages || loading" @click="handlePageChange(query.current + 1)">
                {{ t('pages.balancePage.records.pagination.next') }}
              </Button>
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <Input v-model="jumpPage" class="w-20" :disabled="loading" />
                <Button variant="outline" size="sm" :disabled="loading" @click="handleJumpPage">
                  {{ t('pages.balancePage.records.pagination.jump') }}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </SettingsLayout>
</template>
