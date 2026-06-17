<script setup lang="ts">
defineOptions({ name: 'OrderDownload' })

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CalendarDateTime,
  getLocalTimeZone,
  parseDateTime,
  today,
} from '@internationalized/date'
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
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download } from 'lucide-vue-next'
import { getOrderDownListApi } from '@/api/auth'
import { useCachedPageRequest } from '@/composables/useCachedPageRequest'
import { ApiStatus } from '@/lib/status'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import { computed, h, nextTick, onActivated, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { markLoaded, shouldLoad } = useCachedPageRequest('order-download-page')

const loading = ref(false)
const jumpPage = ref('1')
const tableScrollRef = ref<HTMLElement | null>(null)
const mobileScrollbarRef = ref<HTMLInputElement | null>(null)
const showMobileScrollbar = ref(false)

const query = reactive({
  current: 1,
  size: 20,
  startTime: '',
  endTime: '',
  status: 'all-status',
  taskName: '',
})

const createDefaultDateTime = () => {
  const base = today(getLocalTimeZone())
  return new CalendarDateTime(base.year, base.month, base.day, 0, 0, 0)
}

const dateRange = ref<any>({
  start: createDefaultDateTime(),
  end: createDefaultDateTime(),
})

const listData = ref<{
  list: any[]
  total: number
}>({
  list: [],
  total: 0,
})

const totalPages = computed(() => Math.max(1, Math.ceil((listData.value.total || 0) / query.size)))

const statusOptions = computed(() => [
  { label: t('common.all'), value: 'all-status' },
  { label: t('pages.orderDownloadPage.statusOptions.0'), value: '0' },
  { label: t('pages.orderDownloadPage.statusOptions.1'), value: '1' },
  { label: t('pages.orderDownloadPage.statusOptions.2'), value: '2' },
  { label: t('pages.orderDownloadPage.statusOptions.3'), value: '3' },
])

const datePickerLocale = computed(() => {
  return typeof navigator !== 'undefined' && navigator.language
    ? navigator.language
    : 'zh-CN'
})

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
    return t('pages.orderDownloadPage.filters.selectTimeRange')
  }

  return `${query.startTime.slice(0, 10)} ~ ${query.endTime.slice(0, 10)}`
})

const scrollbarThumbWidth = computed(() => {
  const wrapper = tableScrollRef.value
  if (!wrapper || !wrapper.scrollWidth) return 0
  const width = (wrapper.clientWidth / wrapper.scrollWidth) * 100
  return Math.min(100, Math.max(18, width))
})

const scrollbarThumbOffset = computed(() => {
  const wrapper = tableScrollRef.value
  if (!wrapper) return 0
  const maxScrollLeft = wrapper.scrollWidth - wrapper.clientWidth
  if (maxScrollLeft <= 0) return 0
  return (wrapper.scrollLeft / maxScrollLeft) * (100 - scrollbarThumbWidth.value)
})

const buildQueryPayload = () => ({
  current: query.current,
  size: query.size,
  startTime: query.startTime,
  endTime: query.endTime,
  status: query.status === 'all-status' ? '' : Number(query.status),
  taskName: query.taskName,
})

const statusBadgeClass = (status: string | number) => {
  switch (String(status)) {
    case '0':
      return 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300'
    case '1':
      return 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300'
    case '2':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
    case '3':
      return 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300'
    default:
      return 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300'
  }
}

const fetchOrderDownloads = async () => {
  loading.value = true
  try {
    const res = await getOrderDownListApi(buildQueryPayload())
    if (res.code === ApiStatus.success) {
      listData.value = {
        list: res.data.list || [],
        total: res.data.total || 0,
      }
      jumpPage.value = String(query.current)
      await nextTick()
      syncMobileScrollbar()
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  syncQueryFromDateRange()
  query.current = 1
  fetchOrderDownloads()
}

const handleReset = () => {
  query.startTime = ''
  query.endTime = ''
  query.status = 'all-status'
  query.taskName = ''
  query.current = 1
  jumpPage.value = '1'
  dateRange.value = {
    start: createDefaultDateTime(),
    end: createDefaultDateTime(),
  }
  fetchOrderDownloads()
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value || page === query.current) return
  query.current = page
  fetchOrderDownloads()
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

const handleDownload = (row: any) => {
  if (String(row.status) !== '2') {
    toast({
      title: t('pages.orderDownloadPage.messages.waitTitle'),
      description: t('pages.orderDownloadPage.messages.waitDescription'),
      variant: 'destructive',
    })
    return
  }

  if (!row.filePath) {
    toast({
      title: t('pages.orderDownloadPage.messages.fileMissingTitle'),
      description: t('pages.orderDownloadPage.messages.fileMissingDescription'),
      variant: 'destructive',
    })
    return
  }

  const link = document.createElement('a')
  link.href = row.filePath
  link.download = row.taskName || 'order-export'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const updateMobileScrollbarVisibility = () => {
  const wrapper = tableScrollRef.value
  if (!wrapper || typeof window === 'undefined') {
    showMobileScrollbar.value = false
    return
  }

  showMobileScrollbar.value =
    window.innerWidth < 768 && wrapper.scrollWidth > wrapper.clientWidth
}

const syncMobileScrollbar = () => {
  const wrapper = tableScrollRef.value
  const scrollbar = mobileScrollbarRef.value
  updateMobileScrollbarVisibility()
  if (!wrapper || !scrollbar) return

  const maxScrollLeft = Math.max(0, wrapper.scrollWidth - wrapper.clientWidth)
  scrollbar.max = String(maxScrollLeft)
  scrollbar.value = String(wrapper.scrollLeft)
}

const handleTableScroll = () => {
  syncMobileScrollbar()
}

const handleMobileScrollbarInput = () => {
  const wrapper = tableScrollRef.value
  const scrollbar = mobileScrollbarRef.value
  if (!wrapper || !scrollbar) return
  wrapper.scrollLeft = Number(scrollbar.value || 0)
}

const handleWindowResize = () => {
  syncMobileScrollbar()
}

const columnHelper = createColumnHelper<any>()
const columns = computed(() => [
  columnHelper.accessor('taskName', {
    header: () => t('pages.orderDownloadPage.table.taskName'),
    cell: info => h('div', { class: 'min-w-[220px] font-medium break-all' }, info.getValue() || '-'),
  }),
  columnHelper.accessor('status', {
    header: () => t('pages.orderDownloadPage.table.status'),
    cell: info => {
      const status = info.getValue()
      return h(
        Badge,
        {
          variant: 'outline',
          class: cn('whitespace-nowrap', statusBadgeClass(status)),
        },
        () => t(`pages.orderDownloadPage.statusOptions.${status}`),
      )
    },
  }),
  columnHelper.accessor('admin', {
    header: () => t('pages.orderDownloadPage.table.admin'),
    cell: info => {
      const admin = info.getValue() as any
      return h('div', { class: 'min-w-[160px] font-medium' }, admin?.userName || '-')
    },
  }),
  columnHelper.accessor('errorMsg', {
    header: () => t('pages.orderDownloadPage.table.errorMsg'),
    cell: info => h('div', { class: 'max-w-[220px] break-words text-sm' }, info.getValue() || '-'),
  }),
  columnHelper.accessor('createTime', {
    header: () => t('pages.orderDownloadPage.table.createTime'),
    cell: info => h('div', { class: 'min-w-[180px] whitespace-nowrap' }, info.getValue() || '-'),
  }),
  columnHelper.accessor('updateTime', {
    header: () => t('pages.orderDownloadPage.table.updateTime'),
    cell: info => h('div', { class: 'min-w-[180px] whitespace-nowrap' }, info.getValue() || '-'),
  }),
  columnHelper.display({
    id: 'action',
    header: () => t('pages.orderDownloadPage.table.action'),
    cell: info => {
      const row = info.row.original as any
      return h(
        Button,
        {
          variant: 'outline',
          size: 'sm',
          class: 'whitespace-nowrap',
          onClick: () => handleDownload(row),
        },
        () => [
          h(Download, { class: 'mr-2 h-4 w-4' }),
          t('pages.orderDownloadPage.table.download'),
        ],
      )
    },
  }),
])

const table = useVueTable({
  get data() {
    return listData.value.list
  },
  get columns() {
    return columns.value
  },
  getCoreRowModel: getCoreRowModel(),
})

onMounted(async () => {
  syncDateRangeFromQuery()
  if (shouldLoad()) {
    await fetchOrderDownloads()
    markLoaded()
  }
  await nextTick()
  syncMobileScrollbar()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowResize)
  }
})

onActivated(async () => {
  await nextTick()
  syncMobileScrollbar()
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleWindowResize)
  }
})
</script>

<template>
  <div class="space-y-6 min-w-0 w-full">
    <Card>
      <CardHeader>
        <CardTitle>{{ t('pages.orderDownloadPage.title') }}</CardTitle>
        <CardDescription>{{ t('pages.orderDownloadPage.description') }}</CardDescription>
      </CardHeader>
    </Card>

    <Card class="min-w-0">
      <CardHeader>
        <CardTitle>{{ t('navigation.orderDownload') }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 min-w-0">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div class="space-y-2">
            <Label>{{ t('pages.orderDownloadPage.filters.taskName') }}</Label>
            <Input v-model="query.taskName" />
          </div>

          <div class="space-y-2">
            <Label>{{ t('pages.orderDownloadPage.filters.status') }}</Label>
            <Select v-model="query.status">
              <SelectTrigger>
                <SelectValue :placeholder="t('pages.orderDownloadPage.filters.status')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>{{ t('pages.orderDownloadPage.filters.timeRange') }}</Label>
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
          <div class="flex flex-wrap items-end gap-2 xl:col-span-4">
            <Button @click="handleSearch">{{ t('pages.orderDownloadPage.filters.search') }}</Button>
            <Button variant="outline" @click="handleReset">{{ t('pages.orderDownloadPage.filters.reset') }}</Button>
          </div>
        </div>
        <div class="relative rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-[320px] pb-10 md:pb-0">
          <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div class="flex items-center gap-3 text-sm text-muted-foreground">
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span>{{ t('common.loading') }}</span>
            </div>
          </div>

          <div
            ref="tableScrollRef"
            class="w-full min-w-0 overflow-x-auto overflow-y-hidden"
            @scroll="handleTableScroll"
          >
            <table class="w-full min-w-[960px] text-sm border-separate border-spacing-0">
              <thead class="bg-zinc-50 dark:bg-zinc-900/60 sticky top-0 z-10">
                <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="border-b border-zinc-200 dark:border-zinc-800">
                  <th
                    v-for="header in headerGroup.headers"
                    :key="header.id"
                    class="px-4 py-3 text-left font-medium whitespace-nowrap align-middle bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800"
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
                <tr v-if="!listData.list.length && !loading">
                  <td :colspan="columns.length" class="px-4 py-10 text-center text-muted-foreground">
                    {{ t('pages.orderDownloadPage.empty') }}
                  </td>
                </tr>
                <tr
                  v-for="row in table.getRowModel().rows"
                  :key="row.id"
                  class="border-b border-zinc-200 dark:border-zinc-800"
                >
                  <td
                    v-for="cell in row.getVisibleCells()"
                    :key="cell.id"
                    class="px-4 py-3 align-top border-b border-zinc-200 dark:border-zinc-800"
                  >
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="showMobileScrollbar"
            class="absolute inset-x-0 bottom-0 border-t border-zinc-200 bg-background/95 px-3 py-2 backdrop-blur md:hidden dark:border-zinc-800"
          >
            <input
              ref="mobileScrollbarRef"
              type="range"
              min="0"
              max="0"
              value="0"
              class="mobile-scrollbar-range h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700"
              @input="handleMobileScrollbarInput"
            >
            <div class="pointer-events-none absolute left-3 right-3 top-1/2 h-2 -translate-y-1/2 rounded-full bg-transparent" aria-hidden="true">
              <div
                class="h-2 rounded-full bg-primary/70 transition-all"
                :style="{
                  width: `${scrollbarThumbWidth}%`,
                  transform: `translateX(${scrollbarThumbOffset}%)`,
                }"
              ></div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3 pt-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <span class="break-words">{{ query.current }} / {{ totalPages }} · {{ t('pages.orderDownloadPage.summary.totalTasks') }} {{ listData.total }}</span>
          <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" :disabled="query.current <= 1 || loading" @click="handlePageChange(query.current - 1)">
                {{ t('pages.orderDownloadPage.pagination.prev') }}
              </Button>
              <Button variant="outline" size="sm" :disabled="query.current >= totalPages || loading" @click="handlePageChange(query.current + 1)">
                {{ t('pages.orderDownloadPage.pagination.next') }}
              </Button>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <Input v-model="jumpPage" class="w-20" :disabled="loading" />
              <Button variant="outline" size="sm" :disabled="loading" @click="handleJumpPage">
                {{ t('pages.orderDownloadPage.pagination.jump') }}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.mobile-scrollbar-range::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: transparent;
  border: 0;
}

.mobile-scrollbar-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: transparent;
  border: 0;
}
</style>
