<script setup lang="ts">
defineOptions({ name: 'ExpenseStatistics' })

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import JyIcon from '@/components/JyIcon.vue'
import SafeImg from '@/components/ui/img/SafeImg.vue'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { getOrderSummaryApi } from '@/api/auth'
import { useCachedPageRequest } from '@/composables/useCachedPageRequest'
import { ApiStatus } from '@/lib/status'
import { useDictionaryStore } from '@/store/modules/dictionary'
import { useI18n } from 'vue-i18n'
import { computed, h, nextTick, onActivated, onMounted, onUnmounted, reactive, ref } from 'vue'

const { t } = useI18n()
const dictionaryStore = useDictionaryStore()
const { markLoaded, shouldLoad } = useCachedPageRequest('expense-statistics-page')

const loading = ref(false)
const countriesLoading = ref(false)
const projectsLoading = ref(false)
const tableScrollRef = ref<HTMLElement | null>(null)
const mobileScrollbarRef = ref<HTMLInputElement | null>(null)
const showMobileScrollbar = ref(false)
const countryKeyword = ref('')
const projectKeyword = ref('')

const countries = ref<any[]>([])
const projects = ref<any[]>([])

const query = reactive({
  startTime: '',
  endTime: '',
  countryId: [] as number[],
  projectId: 'all-project',
})

const createDefaultDateTime = () => {
  const base = today(getLocalTimeZone())
  return new CalendarDateTime(base.year, base.month, base.day, 0, 0, 0)
}

const dateRange = ref<any>({
  start: createDefaultDateTime(),
  end: createDefaultDateTime(),
})

const summaryData = ref<any[]>([])

const cleanAssetValue = (value?: string) => String(value || '').replace(/`/g, '').trim()

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
    return t('pages.expenseStatisticsPage.filters.selectTimeRange')
  }

  return `${query.startTime.slice(0, 10)} ~ ${query.endTime.slice(0, 10)}`
})

const datePickerLocale = computed(() => {
  return typeof navigator !== 'undefined' && navigator.language
    ? navigator.language
    : 'zh-CN'
})

const filteredCountries = computed(() => {
  const keyword = countryKeyword.value.trim().toLowerCase()
  if (!keyword) return countries.value
  return countries.value.filter((country) => {
    return [country.name, country.code, country.phoneCode]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(keyword))
  })
})

const filteredProjects = computed(() => {
  const keyword = projectKeyword.value.trim().toLowerCase()
  if (!keyword) return projects.value
  return projects.value.filter((project) => {
    return [project.name, project.code]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(keyword))
  })
})

const selectedCountryLabel = computed(() => {
  if (!query.countryId.length) return t('pages.expenseStatisticsPage.filters.all')
  return `${t('pages.expenseStatisticsPage.filters.country')} (${query.countryId.length})`
})

const selectedProjectLabel = computed(() => {
  if (query.projectId === 'all-project') return t('pages.expenseStatisticsPage.filters.all')
  const project = projects.value.find((item) => String(item.id) === query.projectId)
  return project?.name || t('pages.expenseStatisticsPage.filters.project')
})

const summaryCards = computed(() => [
  { key: 'status1', label: t('pages.expenseStatisticsPage.summary.status1'), value: AllSummary.value.pendingCount || 0 },
  { key: 'status2', label: t('pages.expenseStatisticsPage.summary.status2'), value: AllSummary.value.successCount || 0 },
  { key: 'status3', label: t('pages.expenseStatisticsPage.summary.status3'), value: AllSummary.value.releaseCount || 0 },
  { key: 'status4', label: t('pages.expenseStatisticsPage.summary.status4'), value: AllSummary.value.blackCount || 0 },
  { key: 'total', label: t('pages.expenseStatisticsPage.summary.totalCount'), value: AllSummary.value.totalCount || 0 },
])

const buildQueryPayload = () => ({
  startTime: query.startTime,
  endTime: query.endTime,
  countryId: query.countryId,
  projectId: query.projectId === 'all-project' ? '' : query.projectId,
})

const fetchCountries = async () => {
  countriesLoading.value = true
  try {
    await dictionaryStore.fetchCountries()
    countries.value = dictionaryStore.countries
  } finally {
    countriesLoading.value = false
  }
}

const fetchProjects = async () => {
  projectsLoading.value = true
  try {
    await dictionaryStore.fetchProjects()
    projects.value = dictionaryStore.projects
  } finally {
    projectsLoading.value = false
  }
}
const AllSummary = ref<any>({
  pendingCount: 0,
  successCount: 0,
  releaseCount: 0,
  blackCount: 0,
  totalCount: 0,
})
const fetchSummary = async () => {
  loading.value = true
  try {
    const res = await getOrderSummaryApi(buildQueryPayload())
    if (res.code === ApiStatus.success) {
      summaryData.value = res.data.list || []
      AllSummary.value = res.data.summary || res.summary || {
        pendingCount: 0,
        successCount: 0,
        releaseCount: 0,
        blackCount: 0,
        totalCount: 0,
      }
      await nextTick()
      syncMobileScrollbar()
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  syncQueryFromDateRange()
  fetchSummary()
}

const handleReset = () => {
  query.startTime = ''
  query.endTime = ''
  query.countryId = []
  query.projectId = 'all-project'
  countryKeyword.value = ''
  projectKeyword.value = ''
  dateRange.value = {
    start: createDefaultDateTime(),
    end: createDefaultDateTime(),
  }
  fetchSummary()
}

const handleDateRangeUpdate = (value: DateRange) => {
  dateRange.value = value
  syncQueryFromDateRange()
}

const toggleCountry = (id: number) => {
  if (query.countryId.includes(id)) {
    query.countryId = query.countryId.filter((item) => item !== id)
  } else {
    query.countryId = [...query.countryId, id]
  }
}

const isCountrySelected = (id: number) => query.countryId.includes(id)

const updateMobileScrollbarVisibility = () => {
  const wrapper = tableScrollRef.value
  if (!wrapper || typeof window === 'undefined') {
    showMobileScrollbar.value = false
    return
  }

  showMobileScrollbar.value =
    window.innerWidth < 768 && wrapper.scrollWidth > wrapper.clientWidth
}

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
  columnHelper.accessor('getTime', {
    header: () => t('pages.expenseStatisticsPage.table.getTime'),
    cell: info => h('div', { class: 'min-w-[180px] whitespace-nowrap' }, info.getValue() || '-'),
  }),
  columnHelper.accessor('country', {
    header: () => t('pages.expenseStatisticsPage.table.country'),
    cell: info => {
      const country = info.getValue() as any
      if (!country?.name) return '-'
      return h('div', { class: 'space-y-1 min-w-[180px]' }, [
        h('div', { class: 'flex items-center gap-2 whitespace-nowrap' }, [
          country.flag
            ? h(JyIcon, {
                name: cleanAssetValue(country.flag),
                class: 'h-4 w-4 shrink-0 rounded-sm',
              })
            : null,
          h('span', { class: 'font-medium' }, country.name + country.phoneCode),
        ]),
      ])
    },
  }),
  columnHelper.accessor('project', {
    header: () => t('pages.expenseStatisticsPage.table.project'),
    cell: info => {
      const project = info.getValue() as any
      if (!project?.name) return '-'
      return h('div', { class: 'flex min-w-[220px] items-center gap-2' }, [
        project.icon
          ? h(SafeImg, {
              src: cleanAssetValue(project.icon),
              alt: project.name,
              class: 'h-5 w-5 shrink-0 rounded-sm object-contain',
            })
          : null,
        h('span', { class: 'truncate font-medium' }, project.name),
      ])
    },
  }),
  columnHelper.accessor('pendingCount', {
    header: () => t('pages.expenseStatisticsPage.table.status1'),
    cell: info => info.getValue() ?? 0,
  }),
  columnHelper.accessor('successCount', {
    header: () => t('pages.expenseStatisticsPage.table.status2'),
    cell: info => info.getValue() ?? 0,
  }),
  columnHelper.accessor('releaseCount', {
    header: () => t('pages.expenseStatisticsPage.table.status3'),
    cell: info => info.getValue() ?? 0,
  }),
  columnHelper.accessor('blackCount', {
    header: () => t('pages.expenseStatisticsPage.table.status4'),
    cell: info => info.getValue() ?? 0,
  }),
  columnHelper.display({
    id: 'totalCount',
    header: () => t('pages.expenseStatisticsPage.table.totalCount'),
    cell: info => {
      const row = info.row.original as any
      return row.total ?? row.totalCount ?? 0
    },
  }),
])

const table = useVueTable({
  get data() {
    return summaryData.value
  },
  get columns() {
    return columns.value
  },
  getCoreRowModel: getCoreRowModel(),
})

onMounted(async () => {
  syncDateRangeFromQuery()
  if (shouldLoad()) {
    await Promise.all([fetchCountries(), fetchProjects()])
    await fetchSummary()
    markLoaded()
  } else {
    countries.value = dictionaryStore.countries
    projects.value = dictionaryStore.projects
  }
  await nextTick()
  syncMobileScrollbar()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowResize)
  }
})

onActivated(async () => {
  countries.value = dictionaryStore.countries
  projects.value = dictionaryStore.projects
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
        <CardTitle>{{ t('pages.expenseStatisticsPage.title') }}</CardTitle>
        <CardDescription>{{ t('pages.expenseStatisticsPage.description') }}</CardDescription>
      </CardHeader>
    </Card>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
      <Card v-for="item in summaryCards" :key="item.key">
        <CardHeader>
          <CardTitle>{{ item.label }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold break-all">{{ item.value }}</p>
        </CardContent>
      </Card>
    </div>

    <Card class="min-w-0">
      <CardHeader>
        <CardTitle>{{ t('navigation.expenseStatistics') }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 min-w-0">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div class="space-y-2">
            <Label>{{ t('pages.expenseStatisticsPage.filters.country') }}</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="outline" class="w-full justify-between">
                  <span class="truncate">{{ selectedCountryLabel }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[320px] p-3" align="start">
                <div class="space-y-3">
                  <Input
                    v-model="countryKeyword"
                    :placeholder="t('pages.expenseStatisticsPage.filters.searchCountry')"
                  />
                  <div class="max-h-56 space-y-2 overflow-y-auto">
                    <label
                      v-for="country in filteredCountries"
                      :key="country.id"
                      class="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        :checked="isCountrySelected(country.id)"
                        @change="toggleCountry(country.id)"
                      >
                      <JyIcon
                        v-if="country.flag"
                        :name="cleanAssetValue(country.flag)"
                        class="h-4 w-4 shrink-0 rounded-sm"
                      />
                      <span>{{ country.name }} ({{ country.phoneCode }})</span>
                    </label>
                    <div v-if="countriesLoading" class="text-sm text-muted-foreground">
                      {{ t('common.loading') }}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div class="space-y-2">
            <Label>{{ t('pages.expenseStatisticsPage.filters.project') }}</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="outline" class="w-full justify-between">
                  <span class="truncate">{{ selectedProjectLabel }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[320px] p-3" align="start">
                <div class="space-y-3">
                  <Input
                    v-model="projectKeyword"
                    :placeholder="t('pages.expenseStatisticsPage.filters.searchProject')"
                  />
                  <div class="max-h-56 space-y-2 overflow-y-auto">
                    <button
                      type="button"
                      class="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                      @click="query.projectId = 'all-project'"
                    >
                      {{ t('pages.expenseStatisticsPage.filters.all') }}
                    </button>
                    <button
                      v-for="project in filteredProjects"
                      :key="project.id"
                      type="button"
                      class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                      @click="query.projectId = String(project.id)"
                    >
                      <SafeImg
                        v-if="project.icon"
                        :src="cleanAssetValue(project.icon)"
                        :alt="project.name"
                        class="h-4 w-4 shrink-0 rounded-sm object-contain"
                      />
                      <span class="truncate">{{ project.name }}</span>
                    </button>
                    <div v-if="projectsLoading" class="text-sm text-muted-foreground">
                      {{ t('common.loading') }}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div class="space-y-2">
            <Label>{{ t('pages.expenseStatisticsPage.filters.timeRange') }}</Label>
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

          <div class="hidden">
            <Select model-value="placeholder-option-value">
              <SelectTrigger>
                <SelectValue placeholder="placeholder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder-option-value">placeholder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-wrap items-end gap-2 xl:col-span-4">
            <Button @click="handleSearch">{{ t('pages.expenseStatisticsPage.filters.search') }}</Button>
            <Button variant="outline" @click="handleReset">{{ t('pages.expenseStatisticsPage.filters.reset') }}</Button>
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
                <tr v-if="!summaryData.length && !loading">
                  <td :colspan="columns.length" class="px-4 py-10 text-center text-muted-foreground">
                    {{ t('pages.expenseStatisticsPage.empty') }}
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
