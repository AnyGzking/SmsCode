<script setup lang="ts">
defineOptions({ name: 'SubscribePlan' })

import JyIcon from '@/components/JyIcon.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/toast'
import { createComboOrderApi, getUserComboListApi } from '@/api/auth'
import { ApiStatus } from '@/lib/status'
import { usePublicStore } from '@/store/modules/public'
import { useDictionaryStore } from '@/store/modules/dictionary'
import { CalendarRange, Globe2, RefreshCw, RotateCcw } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type CountryItem = {
  id: string | number
  name: string
  code: string
  flag?: string
  phoneCode?: string
}

type ComboCountryInfo = CountryItem

type ComboItem = {
  id: string | number
  code: string
  name: string
  type: number
  duration: number
  price: string | number
  country: string | number
  status: number
  sort: number
  remark?: string
  countryInfo?: ComboCountryInfo
  createdTime?: string
  updatedTime?: string
}

const { t, locale } = useI18n()
const publicStore = usePublicStore()
const dictionaryStore = useDictionaryStore()

const loading = ref(false)
const submitLoading = ref(false)
const dialogOpen = ref(false)
const countryKeyword = ref('')
const total = ref(0)
const comboList = ref<ComboItem[]>([])
const selectedCombo = ref<ComboItem | null>(null)

const form = reactive({
  country: '',
  type: '',
})

const subscribeForm = reactive({
  numberCount: '1',
  duration: '1',
  autoRenew: false,
})

const currencyUnit = computed(() => publicStore.getConfigItem('system', 'currencyUnit', ''))
const interactionDisabled = computed(() => loading.value || submitLoading.value)

const typeOptions = computed(() => [
  { value: '', label: t('pages.subscribePlanPage.filters.allTypes') },
  { value: '1', label: t('pages.subscribePlanPage.types.day') },
  { value: '2', label: t('pages.subscribePlanPage.types.month') },
  { value: '3', label: t('pages.subscribePlanPage.types.year') },
])

const countries = computed(() => dictionaryStore.countries as CountryItem[])

const filteredCountries = computed(() => {
  const keyword = countryKeyword.value.trim().toLowerCase()
  if (!keyword) return countries.value
  return countries.value.filter((country) => {
    return [country.name, country.code, country.phoneCode, country.id]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(keyword))
  })
})

const selectedCountry = computed(() => {
  return countries.value.find((item) => String(item.id) === String(form.country))
})

const selectedCountryLabel = computed(() => {
  if (!selectedCountry.value) return t('pages.subscribePlanPage.filters.allCountries')
  return `${selectedCountry.value.name} / ${selectedCountry.value.phoneCode || ''}`
})

const activeCount = computed(() => {
  return comboList.value.filter((item) => Number(item.status) === 1).length
})

const normalizePositiveInteger = (value: string | number, fallback = 1) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.max(1, Math.floor(parsed))
}

const selectedDuration = computed(() => {
  const fallback = normalizePositiveInteger(selectedCombo.value?.duration || 1, 1)
  return normalizePositiveInteger(subscribeForm.duration, fallback)
})

const selectedNumberCount = computed(() => {
  return normalizePositiveInteger(subscribeForm.numberCount, 1)
})

const unitPrice = computed(() => {
  if (!selectedCombo.value) return 0
  const baseDuration = normalizePositiveInteger(selectedCombo.value.duration || 1, 1)
  const price = Number(selectedCombo.value.price || 0)
  if (!Number.isFinite(price)) return 0
  return price / baseDuration
})

const totalPrice = computed(() => {
  return unitPrice.value * selectedDuration.value * selectedNumberCount.value
})

const selectedDurationLabel = computed(() => {
  if (!selectedCombo.value) return '-'
  return `${selectedDuration.value}${['zh', 'ja', 'ko'].includes(locale.value) ? '' : ' '}${getTypeLabel(selectedCombo.value.type)}`
})

const formatPrice = (value: string | number) => {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed)) return '0.0000'
  return parsed.toFixed(4)
}

const cleanAssetValue = (value?: string | null) => {
  return String(value || '')
    .replace(/`/g, '')
    .trim()
}

const getTypeLabel = (type: string | number) => {
  switch (Number(type)) {
    case 1:
      return t('pages.subscribePlanPage.types.day')
    case 2:
      return t('pages.subscribePlanPage.types.month')
    case 3:
      return t('pages.subscribePlanPage.types.year')
    default:
      return '-'
  }
}

const formatDuration = (item: ComboItem) => {
  const unit = getTypeLabel(item.type)
  const separator = ['zh', 'ja', 'ko'].includes(locale.value) ? '' : ' '
  return `${item.duration || 0}${separator}${unit}`
}

const getStatusLabel = (status: string | number) => {
  return Number(status) === 1
    ? t('pages.subscribePlanPage.status.enabled')
    : t('pages.subscribePlanPage.status.disabled')
}

const getStatusClass = (status: string | number) => {
  return Number(status) === 1
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
    : 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300'
}

const fetchComboList = async () => {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      current: 1,
      size: 60,
    }

    if (form.country) params.country = form.country
    if (form.type) params.type = Number(form.type)

    const res = await getUserComboListApi(params)
    if (res.code === ApiStatus.success) {
      total.value = Number(res.data?.total || 0)
      comboList.value = res.data?.list || []
      return
    }

    comboList.value = []
    total.value = 0
    toast({
      title: t('common.error'),
      description: res.msg || t('pages.subscribePlanPage.messages.loadFailed'),
      variant: 'destructive',
    })
  } catch (error: unknown) {
    comboList.value = []
    total.value = 0
    toast({
      title: t('common.error'),
      description: error instanceof Error ? error.message : t('pages.subscribePlanPage.messages.loadFailed'),
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

const handleCountryChange = async (countryId: string) => {
  form.country = countryId
  await fetchComboList()
}

const handleTypeChange = async (value: string | number) => {
  form.type = String(value)
  await fetchComboList()
}

const handleReset = async () => {
  form.country = ''
  form.type = ''
  countryKeyword.value = ''
  await fetchComboList()
}

const openSubscribeDialog = (combo: ComboItem) => {
  selectedCombo.value = combo
  subscribeForm.numberCount = '1'
  subscribeForm.duration = String(normalizePositiveInteger(combo.duration || 1, 1))
  subscribeForm.autoRenew = false
  dialogOpen.value = true
}

const normalizeSubscribeForm = () => {
  subscribeForm.numberCount = String(selectedNumberCount.value)
  subscribeForm.duration = String(selectedDuration.value)
}

const handleCreateSubscribeOrder = async () => {
  if (!selectedCombo.value) return

  const duration = selectedDuration.value
  const numberCount = selectedNumberCount.value
  normalizeSubscribeForm()

  if (duration <= 0) {
    toast({
      title: t('common.error'),
      description: t('pages.subscribePlanPage.messages.invalidDuration'),
      variant: 'destructive',
    })
    return
  }

  if (numberCount <= 0) {
    toast({
      title: t('common.error'),
      description: t('pages.subscribePlanPage.messages.invalidNumberCount'),
      variant: 'destructive',
    })
    return
  }

  submitLoading.value = true
  try {
    const payload = {
      comboId: selectedCombo.value.id,
      comboCode: selectedCombo.value.code,
      comboType: selectedCombo.value.type,
      country: selectedCombo.value.country,
      duration,
      numberCount,
      autoRenew: subscribeForm.autoRenew,
      combo: selectedCombo.value,
    }

    const res = await createComboOrderApi(payload)
    if (res.code === ApiStatus.success) {
      dialogOpen.value = false
      toast({
        title: t('common.success'),
        description: res.msg || t('pages.subscribePlanPage.messages.createSuccess'),
      })
      return
    }

    toast({
      title: t('common.error'),
      description: res.msg || t('pages.subscribePlanPage.messages.createFailed'),
      variant: 'destructive',
    })
  } catch (error: unknown) {
    toast({
      title: t('common.error'),
      description: error instanceof Error ? error.message : t('pages.subscribePlanPage.messages.createFailed'),
      variant: 'destructive',
    })
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await dictionaryStore.fetchCountries()
  await fetchComboList()
})
</script>

<template>
  <div class="min-w-0 w-full space-y-6">
    <Card class="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 shadow-sm">
      <CardContent class="p-6 md:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-3">
            <div class="inline-flex items-center rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium text-primary">
              {{ t('pages.subscribePlanPage.filters.title') }}
            </div>
            <div class="space-y-2">
              <h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
                {{ t('pages.subscribePlanPage.title') }}
              </h1>
              <p class="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                {{ t('pages.subscribePlanPage.description') }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:min-w-[320px]">
            <div class="rounded-2xl border bg-background/80 p-4 backdrop-blur">
              <div class="text-xs text-muted-foreground">
                {{ t('pages.subscribePlanPage.stats.total') }}
              </div>
              <div class="mt-2 text-2xl font-semibold">
                {{ total }}
              </div>
            </div>
            <div class="rounded-2xl border bg-background/80 p-4 backdrop-blur">
              <div class="text-xs text-muted-foreground">
                {{ t('pages.subscribePlanPage.stats.active') }}
              </div>
              <div class="mt-2 text-2xl font-semibold">
                {{ activeCount }}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{{ t('pages.subscribePlanPage.filters.title') }}</CardTitle>
        <CardDescription>{{ t('pages.subscribePlanPage.filters.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_auto] lg:items-end">
          <div class="space-y-2">
            <Label>{{ t('pages.subscribePlanPage.filters.country') }}</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="outline" class="w-full justify-between" :disabled="interactionDisabled">
                  <span class="truncate">{{ selectedCountryLabel }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                class="w-[min(450px,calc(100vw-2rem))] min-w-[340px] max-w-[450px] p-3"
                align="start"
              >
                <div class="space-y-3">
                  <Input
                    v-model="countryKeyword"
                    :placeholder="t('pages.subscribePlanPage.filters.placeholders.searchCountry')"
                    :disabled="interactionDisabled"
                  />
                  <div class="max-h-64 space-y-2 overflow-y-auto">
                    <button
                      type="button"
                      :disabled="interactionDisabled"
                      class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      @click="handleCountryChange('')"
                    >
                      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Globe2 class="h-4 w-4" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="truncate font-medium">
                          {{ t('pages.subscribePlanPage.filters.allCountries') }}
                        </div>
                      </div>
                    </button>

                    <button
                      v-for="country in filteredCountries"
                      :key="country.id"
                      type="button"
                      :disabled="interactionDisabled"
                      class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      @click="handleCountryChange(String(country.id))"
                    >
                      <JyIcon
                        v-if="country.flag"
                        :name="cleanAssetValue(country.flag)"
                        class="h-8 w-8 shrink-0 rounded-sm"
                      />
                      <div
                        v-else
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                      >
                        <Globe2 class="h-4 w-4" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="truncate font-medium">
                          {{ country.name }}
                        </div>
                        <div class="truncate text-xs text-muted-foreground">
                          {{ country.code }}
                        </div>
                      </div>
                      <div class="shrink-0 text-xs text-muted-foreground">
                        {{ country.phoneCode }}
                      </div>
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div class="space-y-2">
            <Label>{{ t('pages.subscribePlanPage.filters.durationType') }}</Label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in typeOptions"
                :key="option.value || 'all'"
                type="button"
                :disabled="interactionDisabled"
                class="rounded-full border px-4 py-2 text-sm transition-colors"
                :class="
                  form.type === option.value
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background hover:bg-muted'
                "
                @click="handleTypeChange(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button variant="outline" :disabled="interactionDisabled" @click="fetchComboList">
              <RefreshCw class="mr-2 h-4 w-4" :class="loading ? 'animate-spin' : ''" />
              {{ t('pages.subscribePlanPage.filters.search') }}
            </Button>
            <Button variant="ghost" :disabled="interactionDisabled" @click="handleReset">
              <RotateCcw class="mr-2 h-4 w-4" />
              {{ t('pages.subscribePlanPage.filters.reset') }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <div v-if="comboList.length" class="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      <Card
        v-for="combo in comboList"
        :key="combo.id"
        class="group overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      >
        <CardContent class="space-y-5 p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 space-y-1">
              <div class="truncate text-lg font-semibold">
                {{ combo.name }}
              </div>
              <div class="truncate text-xs text-muted-foreground">
                #{{ combo.code }}
              </div>
            </div>
            <div
              class="rounded-full border px-3 py-1 text-xs font-medium"
              :class="getStatusClass(combo.status)"
            >
              {{ getStatusLabel(combo.status) }}
            </div>
          </div>

          <div class="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background shadow-sm">
              <JyIcon
                v-if="combo.countryInfo?.flag"
                :name="cleanAssetValue(combo.countryInfo.flag)"
                class="h-8 w-8 rounded-sm"
              />
              <Globe2 v-else class="h-5 w-5 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm text-muted-foreground">
                {{ t('pages.subscribePlanPage.card.country') }}
              </div>
              <div class="truncate font-medium">
                {{ combo.countryInfo?.name || '-' }}
              </div>
            </div>
            <div class="text-right text-xs text-muted-foreground">
              {{ combo.countryInfo?.phoneCode || '' }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl border bg-background p-4">
              <div class="text-xs text-muted-foreground">
                {{ t('pages.subscribePlanPage.card.price') }}
              </div>
              <div class="mt-2 text-2xl font-semibold text-primary">
                {{ formatPrice(combo.price) }}{{ currencyUnit }}
              </div>
            </div>
            <div class="rounded-2xl border bg-background p-4">
              <div class="text-xs text-muted-foreground">
                {{ t('pages.subscribePlanPage.card.duration') }}
              </div>
              <div class="mt-2 flex items-center gap-2 text-lg font-semibold">
                <CalendarRange class="h-4 w-4 text-primary" />
                <span>{{ formatDuration(combo) }}</span>
              </div>
            </div>
          </div>

          <div class="space-y-3 text-sm">
            <div class="flex items-start justify-between gap-4">
              <span class="text-muted-foreground">{{ t('pages.subscribePlanPage.card.remark') }}</span>
              <span class="max-w-[70%] text-right text-foreground">
                {{ combo.remark || t('pages.subscribePlanPage.card.noRemark') }}
              </span>
            </div>
            <div class="flex items-start justify-between gap-4">
              <span class="text-muted-foreground">{{ t('pages.subscribePlanPage.card.createdTime') }}</span>
              <span class="text-right">{{ combo.createdTime || '-' }}</span>
            </div>
            <div class="flex items-start justify-between gap-4">
              <span class="text-muted-foreground">{{ t('pages.subscribePlanPage.card.updatedTime') }}</span>
              <span class="text-right">{{ combo.updatedTime || '-' }}</span>
            </div>
          </div>

          <Button
            class="h-12 w-full cursor-pointer items-center justify-center bg-[#42b883] font-medium text-white duration-300 hover:bg-[#42b883]/90 md:inline-flex"
            :disabled="interactionDisabled"
            @click="openSubscribeDialog(combo)"
          >
            {{ t('pages.subscribePlanPage.card.subscribe') }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <Card v-else>
      <CardContent class="flex min-h-[240px] items-center justify-center p-6">
        <div class="space-y-3 text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Globe2 class="h-6 w-6" />
          </div>
          <h2 class="text-xl font-semibold">{{ t('pages.subscribePlanPage.empty') }}</h2>
          <p class="text-sm text-muted-foreground">
            {{ t('pages.subscribePlanPage.filters.description') }}
          </p>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{{ t('pages.subscribePlanPage.dialog.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('pages.subscribePlanPage.dialog.description') }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedCombo" class="space-y-5">
          <div class="rounded-2xl border bg-muted/30 p-4">
            <div class="text-base font-semibold">{{ selectedCombo.name }}</div>
            <div class="mt-1 text-sm text-muted-foreground">
              #{{ selectedCombo.code }} · {{ selectedCombo.countryInfo?.name || '-' }}
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label>{{ t('pages.subscribePlanPage.dialog.numberCount') }}</Label>
              <Input
                v-model="subscribeForm.numberCount"
                type="number"
                min="1"
                :disabled="submitLoading"
                @blur="normalizeSubscribeForm"
              />
            </div>

            <div class="space-y-2">
              <Label>{{ t('pages.subscribePlanPage.dialog.duration') }}</Label>
              <div class="flex items-center gap-2">
                <Input
                  v-model="subscribeForm.duration"
                  type="number"
                  min="1"
                  :disabled="submitLoading"
                  @blur="normalizeSubscribeForm"
                />
                <div class="shrink-0 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {{ selectedCombo ? getTypeLabel(selectedCombo.type) : '-' }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between rounded-2xl border px-4 py-3">
            <div>
              <div class="text-sm font-medium">{{ t('pages.subscribePlanPage.dialog.autoRenew') }}</div>
              <div class="text-sm text-muted-foreground">
                {{ t('pages.subscribePlanPage.dialog.autoRenewHint') }}
              </div>
            </div>
            <Switch v-model:checked="subscribeForm.autoRenew" :disabled="submitLoading" />
          </div>

          <div class="space-y-3 rounded-2xl border bg-background p-4">
            <div class="text-sm font-medium">{{ t('pages.subscribePlanPage.dialog.summary') }}</div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-muted-foreground">{{ t('pages.subscribePlanPage.dialog.plan') }}</span>
              <span class="text-right">{{ selectedCombo.name }}</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-muted-foreground">{{ t('pages.subscribePlanPage.dialog.unitPrice') }}</span>
              <span class="text-right">{{ formatPrice(unitPrice) }}{{ currencyUnit }}</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-muted-foreground">{{ t('pages.subscribePlanPage.dialog.duration') }}</span>
              <span class="text-right">{{ selectedDurationLabel }}</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-muted-foreground">{{ t('pages.subscribePlanPage.dialog.numberCount') }}</span>
              <span class="text-right">{{ selectedNumberCount }}</span>
            </div>
            <div class="flex items-center justify-between gap-4 border-t pt-3 text-base font-semibold">
              <span>{{ t('pages.subscribePlanPage.dialog.totalPrice') }}</span>
              <span class="text-primary">{{ formatPrice(totalPrice) }}{{ currencyUnit }}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="submitLoading" @click="dialogOpen = false">
            {{ t('common.cancel') }}
          </Button>
          <Button
            class="bg-[#42b883] text-white hover:bg-[#42b883]/90"
            :disabled="submitLoading || !selectedCombo"
            @click="handleCreateSubscribeOrder"
          >
            {{ submitLoading ? t('pages.subscribePlanPage.dialog.submitting') : t('pages.subscribePlanPage.card.subscribe') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
