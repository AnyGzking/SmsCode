<script setup lang="ts">
defineOptions({
  name: "MyOrders",
});

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import JyIcon from "@/components/JyIcon.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SafeImg from "@/components/ui/img/SafeImg.vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDateTime,
  getLocalTimeZone,
  parseDateTime,
  today,
} from "@internationalized/date";
import {
  exportOrderApi,
  getMyOrderListApi,
} from "@/api/auth";
import { useCachedPageRequest } from "@/composables/useCachedPageRequest";
import { ApiStatus } from "@/lib/status";
import { useDictionaryStore } from "@/store/modules/dictionary";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { useI18n } from "vue-i18n";
import {
  computed,
  h,
  onActivated,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from "vue";
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  useVueTable,
} from "@tanstack/vue-table";
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
} from "radix-vue";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";

const { t } = useI18n();
const dictionaryStore = useDictionaryStore();
const { markLoaded, shouldLoad } = useCachedPageRequest("my-orders-page");

const loading = ref(false);
const countriesLoading = ref(false);
const projectsLoading = ref(false);
const exportLoading = ref(false);
const jumpPage = ref("1");
const countryKeyword = ref("");
const projectKeyword = ref("");
const tableScrollRef = ref<HTMLElement | null>(null);
const mobileScrollbarRef = ref<HTMLInputElement | null>(null);
const showMobileScrollbar = ref(false);

const countries = ref<any[]>([]);
const projects = ref<any[]>([]);

const query = reactive({
  current: 1,
  size: 20,
  countryId: [] as number[],
  projectId: "all",
  status: "all",
  phone: "",
  orderNo: "",
  startTime: "",
  endTime: "",
});

const createDefaultDateTime = () => {
  const base = today(getLocalTimeZone());
  return new CalendarDateTime(base.year, base.month, base.day, 0, 0, 0);
};

const dateRange = ref<any>({
  start: createDefaultDateTime(),
  end: createDefaultDateTime(),
});

const orderData = ref<{
  list: any[];
  total: number;
  successAmount: number;
  failAmount: number;
  totalAmount: number;
}>({
  list: [],
  total: 0,
  successAmount: 0,
  failAmount: 0,
  totalAmount: 0,
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil((orderData.value.total || 0) / query.size)),
);

const statusOptions = computed(() => [
  { label: t("pages.myOrdersPage.filters.all"), value: "all" },
  { label: t("pages.myOrdersPage.statusOptions.1"), value: "1" },
  { label: t("pages.myOrdersPage.statusOptions.2"), value: "2" },
  { label: t("pages.myOrdersPage.statusOptions.3"), value: "3" },
  { label: t("pages.myOrdersPage.statusOptions.4"), value: "4" },
]);

const filteredCountries = computed(() => {
  const keyword = countryKeyword.value.trim().toLowerCase();
  if (!keyword) return countries.value;
  return countries.value.filter((country) => {
    return [country.name, country.code, country.phoneCode]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(keyword));
  });
});

const filteredProjects = computed(() => {
  const keyword = projectKeyword.value.trim().toLowerCase();
  if (!keyword) return projects.value;
  return projects.value.filter((project) => {
    return [project.name, project.code]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(keyword));
  });
});

const selectedCountryLabel = computed(() => {
  if (!query.countryId.length) return t("pages.myOrdersPage.filters.all");
  return `${t("pages.myOrdersPage.filters.country")} (${query.countryId.length})`;
});

const selectedProjectLabel = computed(() => {
  if (query.projectId === "all") return t("pages.myOrdersPage.filters.all");
  const project = projects.value.find(
    (item) => String(item.id) === query.projectId,
  );
  return project?.name || t("pages.myOrdersPage.filters.project");
});

const cleanAssetValue = (value?: string) =>
  String(value || "")
    .replace(/`/g, "")
    .trim();

const formatDateOnlyValue = (value?: CalendarDateTime) => {
  if (!value) return "";
  const year = String(value.year).padStart(4, "0");
  const month = String(value.month).padStart(2, "0");
  const day = String(value.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// const formatDateTimeValue = (value?: CalendarDateTime) => {
//   if (!value) return "";
//   const year = String(value.year).padStart(4, "0");
//   const month = String(value.month).padStart(2, "0");
//   const day = String(value.day).padStart(2, "0");
//   const hour = String(value.hour).padStart(2, "0");
//   const minute = String(value.minute).padStart(2, "0");
//   const second = String(value.second).padStart(2, "0");
//   return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
// };

const parseDateTimeValue = (value?: string) => {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return undefined;
  const normalized = cleanValue.replace(" ", "T");
  try {
    return parseDateTime(
      normalized.length === 16 ? `${normalized}:00` : normalized,
    );
  } catch {
    return undefined;
  }
};

const syncQueryFromDateRange = () => {
  const start = dateRange.value.start as CalendarDateTime | undefined;
  const end = dateRange.value.end as CalendarDateTime | undefined;
  const startDate = formatDateOnlyValue(start);
  const endDate = formatDateOnlyValue(end);

  query.startTime = startDate ? `${startDate} 00:00:00` : "";
  query.endTime = endDate ? `${endDate} 23:59:59` : "";
};

const syncDateRangeFromQuery = () => {
  dateRange.value = {
    start: parseDateTimeValue(query.startTime) || createDefaultDateTime(),
    end: parseDateTimeValue(query.endTime) || createDefaultDateTime(),
  };
};

const dateRangeLabel = computed(() => {
  if (!query.startTime || !query.endTime) {
    return t("pages.myOrdersPage.filters.selectTimeRange");
  }

  return `${query.startTime.slice(0, 10)} ~ ${query.endTime.slice(0, 10)}`;
});

const datePickerLocale = computed(() => {
  return typeof navigator !== "undefined" && navigator.language
    ? navigator.language
    : "zh-CN";
});

const scrollbarThumbWidth = computed(() => {
  const wrapper = tableScrollRef.value;
  if (!wrapper || !wrapper.scrollWidth) return 0;
  const width = (wrapper.clientWidth / wrapper.scrollWidth) * 100;
  return Math.min(100, Math.max(18, width));
});

const scrollbarThumbOffset = computed(() => {
  const wrapper = tableScrollRef.value;
  if (!wrapper) return 0;
  const maxScrollLeft = wrapper.scrollWidth - wrapper.clientWidth;
  if (maxScrollLeft <= 0) return 0;
  return (
    (wrapper.scrollLeft / maxScrollLeft) * (100 - scrollbarThumbWidth.value)
  );
});

const getDateRange = () => {
  if (!query.startTime || !query.endTime) return [] as string[];
  return [query.startTime, query.endTime];
};

const buildOrderQueryPayload = () => ({
  countryId: query.countryId,
  daterange: getDateRange(),
  orderNo: query.orderNo,
  phone: query.phone,
  projectId: query.projectId === "all" ? "" : query.projectId,
  status: query.status === "all" ? "" : query.status,
  startTime: query.startTime,
  endTime: query.endTime,
  current: query.current,
  size: query.size,
});

const statusBadgeClass = (status: string | number) => {
  switch (String(status)) {
    case "1":
      return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300";
    case "2":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    case "3":
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
    case "4":
      return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
    default:
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
  }
};

const sourceTypeLabel = (value: string | number) => {
  const sourceType = String(value || "");
  if (sourceType === "1") {
    return t("pages.myOrdersPage.sourceTypeOptions.1");
  }
  if (sourceType === "2") {
    return t("pages.myOrdersPage.sourceTypeOptions.2");
  }
  if (sourceType === "3") {
    return t("pages.myOrdersPage.sourceTypeOptions.3");
  }
  return "-";
};

const tableMinWidth = "min-w-full";

const getCellClass = (columnId: string) => {
  switch (columnId) {
    case "orderNo":
      return "w-[13%] whitespace-nowrap";
    case "country":
      return "w-[11%]";
    case "project":
      return "w-[11%] whitespace-nowrap";
    case "phone":
      return "w-[16%]";
    case "cardInfo":
      return "w-[14%] break-all";
    case "price":
      return "w-[8%] whitespace-nowrap";
    case "status":
      return "w-[9%] whitespace-nowrap";
    case "codeNum":
      return "w-[9%] whitespace-nowrap";
    case "smsContent":
      return "w-[13%] break-words";
    case "sourceType":
      return "w-[8%] whitespace-nowrap";
    case "timeInfo":
      return "w-[12%] whitespace-nowrap";
    default:
      return "w-auto";
  }
};

// const compactColumnIds = new Set([
//   "country",
//   "project",
//   "phone",
//   "price",
//   "status",
//   "codeNum",
// ]);

// const getTableCellPaddingClass = (columnId: string) => {
//   return compactColumnIds.has(columnId) ? "px-3 py-2.5" : "px-4 py-3";
// };

const fetchCountries = async () => {
  countriesLoading.value = true;
  try {
    await dictionaryStore.fetchCountries();
    countries.value = dictionaryStore.countries;
  } finally {
    countriesLoading.value = false;
  }
};

const fetchProjects = async () => {
  projectsLoading.value = true;
  try {
    await dictionaryStore.fetchProjects();
    projects.value = dictionaryStore.projects;
  } finally {
    projectsLoading.value = false;
  }
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    const payload = buildOrderQueryPayload();
    const res = await getMyOrderListApi(payload);
    if (res.code === ApiStatus.success) {
      orderData.value = {
        list: res.data.list || [],
        total: res.data.total || 0,
        successAmount: Number(res.data.successAmount || 0),
        failAmount: Number(res.data.failAmount || 0),
        totalAmount: Number(res.data.totalAmount || 0),
      };
      jumpPage.value = String(query.current);
    }
  } finally {
    loading.value = false;
  }
};

const handleExport = async () => {
  exportLoading.value = true;
  try {
    const res = await exportOrderApi(buildOrderQueryPayload());
    if (res.code === ApiStatus.success) {
      toast({
        title: t("pages.myOrdersPage.export.successTitle"),
        description: t("pages.myOrdersPage.export.successDescription"),
      });
      return;
    }

    toast({
      title: t("pages.myOrdersPage.export.failedTitle"),
      description: res.msg || t("pages.myOrdersPage.export.failedDescription"),
      variant: "destructive",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : t("pages.myOrdersPage.export.failedDescription");
    toast({
      title: t("pages.myOrdersPage.export.failedTitle"),
      description: message,
      variant: "destructive",
    });
  } finally {
    exportLoading.value = false;
  }
};

const handleSearch = () => {
  syncQueryFromDateRange();
  query.current = 1;
  fetchOrders();
};

const handleReset = () => {
  query.countryId = [];
  query.projectId = "all";
  query.status = "all";
  query.phone = "";
  query.orderNo = "";
  query.startTime = "";
  query.endTime = "";
  dateRange.value = {
    start: createDefaultDateTime(),
    end: createDefaultDateTime(),
  };
  countryKeyword.value = "";
  projectKeyword.value = "";
  query.current = 1;
  jumpPage.value = "1";
  fetchOrders();
};

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value || page === query.current) return;
  query.current = page;
  fetchOrders();
};

const handleJumpPage = () => {
  const page = Number(jumpPage.value);
  if (!Number.isInteger(page)) return;
  handlePageChange(page);
};

const handleDateRangeUpdate = (value: DateRange) => {
  dateRange.value = value;
  syncQueryFromDateRange();
};

const updateMobileScrollbarVisibility = () => {
  const wrapper = tableScrollRef.value;
  if (!wrapper || typeof window === "undefined") {
    showMobileScrollbar.value = false;
    return;
  }

  showMobileScrollbar.value =
    window.innerWidth < 768 && wrapper.scrollWidth > wrapper.clientWidth;
};

const syncMobileScrollbar = () => {
  const wrapper = tableScrollRef.value;
  const scrollbar = mobileScrollbarRef.value;
  updateMobileScrollbarVisibility();
  if (!wrapper || !scrollbar) return;

  const maxScrollLeft = Math.max(0, wrapper.scrollWidth - wrapper.clientWidth);
  scrollbar.max = String(maxScrollLeft);
  scrollbar.value = String(wrapper.scrollLeft);
};

const handleTableScroll = () => {
  syncMobileScrollbar();
};

const handleMobileScrollbarInput = () => {
  const wrapper = tableScrollRef.value;
  const scrollbar = mobileScrollbarRef.value;
  if (!wrapper || !scrollbar) return;
  wrapper.scrollLeft = Number(scrollbar.value || 0);
};

const handleWindowResize = () => {
  syncMobileScrollbar();
};

const toggleCountry = (id: number) => {
  if (query.countryId.includes(id)) {
    query.countryId = query.countryId.filter((item) => item !== id);
  } else {
    query.countryId = [...query.countryId, id];
  }
};

const isCountrySelected = (id: number) => query.countryId.includes(id);

const columnHelper = createColumnHelper<any>();
const columns = computed(() => [
  columnHelper.accessor("orderNo", {
    header: () => t("pages.myOrdersPage.table.orderNo"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("country", {
    header: () => t("pages.myOrdersPage.table.country"),
    cell: (info) => {
      const country = info.getValue() as any;
      if (!country?.name) return "-";
      return h("div", { class: "space-y-1" }, [
        h("div", { class: "flex items-center gap-2 whitespace-nowrap" }, [
          country?.flag
            ? h(JyIcon, {
                name: cleanAssetValue(country.flag),
                class: "h-4 w-4 shrink-0 rounded-sm",
              })
            : null,
          h(
            "span",
            { class: "truncate font-medium" },
            country.name + country.phoneCode,
          ),
        ]),
      ]);
    },
  }),
  columnHelper.accessor("project", {
    header: () => t("pages.myOrdersPage.table.project"),
    cell: (info) => {
      const project = info.getValue() as any;
      if (!project?.name) return "-";
      return h("div", { class: "flex items-center gap-2" }, [
        project?.icon ? null : null,
        project?.icon
          ? h(SafeImg, {
              src: cleanAssetValue(project.icon),
              alt: project.name,
              class: "h-5 w-5 shrink-0 rounded-sm object-contain",
            })
          : null,
        h("span", { class: "truncate" }, project.name),
      ]);
    },
  }),
  columnHelper.accessor("phone", {
    header: () => t("pages.myOrdersPage.table.phone"),
    cell: (info) => {
      const row = info.row.original as any;
      return h("div", { class: "space-y-1" }, [
        h(
          Badge,
          {
            variant: "secondary",
            class: "whitespace-nowrap " + statusBadgeClass(row.status),
          },
          () => {
            const prefix =
              row.countryTel ||
              row.country?.phoneTel ||
              row.country?.phoneCode ||
              "";
            const phone = row.phone || "-";
            return prefix ? `+${prefix} ${phone}` : phone;
          },
        ),
        h(
          "div",
          { class: "text-xs text-muted-foreground break-all" },
          `PKEY: ${row.pkey || "-"}`,
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "cardInfo",
    header: () => "ICCID/IMSI",
    cell: (info) => {
      const row = info.row.original as any;
      return h("div", { class: "space-y-1 text-xs" }, [
        h("div", {}, `ICCID: ${row.iccid || "-"}`),
        h("div", {}, `IMSI: ${row.imsi || "-"}`),
      ]);
    },
  }),
  columnHelper.accessor("price", {
    header: () => t("pages.myOrdersPage.table.price"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("status", {
    header: () => t("pages.myOrdersPage.table.status"),
    cell: (info) => {
      const status = info.getValue();
      return h(
        Badge,
        {
          variant: "outline",
          class: cn("whitespace-nowrap", statusBadgeClass(status)),
        },
        () => t(`pages.myOrdersPage.statusOptions.${status}`),
      );
    },
  }),
  columnHelper.accessor("codeNum", {
    header: () => t("pages.myOrdersPage.table.codeNum"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("smsContent", {
    header: () => t("pages.myOrdersPage.table.smsContent"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("sourceType", {
    header: () => t("pages.myOrdersPage.table.sourceType"),
    cell: (info) => sourceTypeLabel(info.getValue()),
  }),
  columnHelper.display({
    id: "timeInfo",
    header: () => t("pages.myOrdersPage.table.timeInfo"),
    cell: (info) => {
      const row = info.row.original as any;
      return h("div", { class: "space-y-1 whitespace-nowrap" }, [
        h(
          "div",
          { class: "text-sm" },
          `${t("pages.myOrdersPage.table.createTime")}: ${row.createTime || "-"}`,
        ),
        h(
          "div",
          { class: "text-xs text-muted-foreground" },
          `${t("pages.myOrdersPage.table.updateTime")}: ${row.updateTime || "-"}`,
        ),
      ]);
    },
  }),
]);

const table = useVueTable({
  get data() {
    return orderData.value.list;
  },
  get columns() {
    return columns.value;
  },
  getCoreRowModel: getCoreRowModel(),
});

onMounted(async () => {
  syncDateRangeFromQuery();
  if (shouldLoad()) {
    await Promise.all([fetchCountries(), fetchProjects()]);
    await fetchOrders();
    markLoaded();
  } else {
    countries.value = dictionaryStore.countries;
    projects.value = dictionaryStore.projects;
  }
  await nextTick();
  syncMobileScrollbar();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", handleWindowResize);
  }
});

onActivated(async () => {
  countries.value = dictionaryStore.countries;
  projects.value = dictionaryStore.projects;
  await nextTick();
  syncMobileScrollbar();
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleWindowResize);
  }
});
</script>

<template>
  <div class="space-y-6 min-w-0 w-full">
    <Card>
      <CardHeader>
        <CardTitle>{{ t("pages.myOrdersPage.title") }}</CardTitle>
        <CardDescription>{{
          t("pages.myOrdersPage.description")
        }}</CardDescription>
      </CardHeader>
    </Card>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>{{
            t("pages.myOrdersPage.summary.totalOrders")
          }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold break-all">{{ orderData.total }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{{
            t("pages.myOrdersPage.summary.successAmount")
          }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold break-all">
            {{ orderData.successAmount }}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{{
            t("pages.myOrdersPage.summary.failAmount")
          }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold break-all">{{ orderData.failAmount }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{{
            t("pages.myOrdersPage.summary.totalAmount")
          }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold break-all">
            {{ orderData.totalAmount }}
          </p>
        </CardContent>
      </Card>
    </div>

    <Card class="min-w-0">
      <CardHeader>
        <CardTitle>{{ t("navigation.myOrders") }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 min-w-0">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div class="space-y-2">
            <Label>{{ t("pages.myOrdersPage.filters.country") }}</Label>
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
                    :placeholder="t('pages.myOrdersPage.filters.searchCountry')"
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
                      />
                      <JyIcon
                        v-if="country.flag"
                        :name="cleanAssetValue(country.flag)"
                        class="h-4 w-4 shrink-0 rounded-sm"
                      />
                      <span>{{ country.name }} ({{ country.phoneCode }})</span>
                    </label>
                    <div
                      v-if="countriesLoading"
                      class="text-sm text-muted-foreground"
                    >
                      {{ t("common.loading") }}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div class="space-y-2">
            <Label>{{ t("pages.myOrdersPage.filters.project") }}</Label>
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
                    :placeholder="t('pages.myOrdersPage.filters.searchProject')"
                  />
                  <div class="max-h-56 space-y-2 overflow-y-auto">
                    <button
                      type="button"
                      class="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                      @click="query.projectId = 'all'"
                    >
                      {{ t("pages.myOrdersPage.filters.all") }}
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
                    <div
                      v-if="projectsLoading"
                      class="text-sm text-muted-foreground"
                    >
                      {{ t("common.loading") }}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div class="space-y-2">
            <Label>{{ t("pages.myOrdersPage.filters.status") }}</Label>
            <Select v-model="query.status">
              <SelectTrigger>
                <SelectValue
                  :placeholder="t('pages.myOrdersPage.filters.status')"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>{{ t("pages.myOrdersPage.filters.phone") }}</Label>
            <Input v-model="query.phone" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div class="space-y-2">
            <Label>{{ t("pages.myOrdersPage.filters.orderNo") }}</Label>
            <Input v-model="query.orderNo" />
          </div>

          <div class="space-y-2">
            <Label>{{ t("pages.myOrdersPage.filters.timeRange") }}</Label>
            <DateRangePickerRoot
              v-model="dateRange"
              :locale="datePickerLocale"
              granularity="second"
              :hour-cycle="24"
              :number-of-months="2"
              @update:model-value="handleDateRangeUpdate"
            >
              <DateRangePickerField as-child>
                <Button
                  variant="outline"
                  class="w-full justify-between text-left font-normal"
                >
                  <span class="truncate">{{ dateRangeLabel }}</span>
                  <DateRangePickerTrigger as-child>
                    <span
                      class="ml-2 inline-flex shrink-0 text-muted-foreground"
                    >
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
                    <DateRangePickerHeader
                      class="mb-3 flex items-center justify-between gap-2"
                    >
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
                          <DateRangePickerGridRow
                            class="mb-1 grid grid-cols-7 gap-1"
                          >
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
            <Button @click="handleSearch">{{
              t("pages.myOrdersPage.filters.search")
            }}</Button>
            <Button variant="outline" @click="handleReset">{{
              t("pages.myOrdersPage.filters.reset")
            }}</Button>
            <Button
              variant="outline"
              :disabled="exportLoading"
              @click="handleExport"
              >{{
                exportLoading
                  ? t("pages.myOrdersPage.export.loading")
                  : t("pages.myOrdersPage.export.button")
              }}</Button
            >
          </div>
        </div>

        <div
          class="relative rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-[320px] pb-10 md:pb-0"
        >
          <div
            v-if="loading"
            class="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm"
          >
            <div class="flex items-center gap-3 text-sm text-muted-foreground">
              <div
                class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
              ></div>
              <span>{{ t("common.loading") }}</span>
            </div>
          </div>

          <div
            ref="tableScrollRef"
            class="w-full min-w-0 overflow-x-auto overflow-y-hidden"
            @scroll="handleTableScroll"
          >
            <table
              :class="[
                tableMinWidth,
                'table-fixed text-sm border-separate border-spacing-0',
              ]"
            >
              <thead class="bg-zinc-50 dark:bg-zinc-900/60 sticky top-0 z-10">
                <tr
                  v-for="headerGroup in table.getHeaderGroups()"
                  :key="headerGroup.id"
                  class="border-b border-zinc-200 dark:border-zinc-800"
                >
                  <th
                    v-for="header in headerGroup.headers"
                    :key="header.id"
                    :class="[
                      'px-4 py-3 text-left font-medium whitespace-nowrap align-middle bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800',
                      getCellClass(header.column.id),
                    ]"
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
                <tr v-if="!orderData.list.length && !loading">
                  <td
                    :colspan="columns.length"
                    class="px-4 py-10 text-center text-muted-foreground"
                  >
                    {{ t("pages.myOrdersPage.empty") }}
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
                    :class="[
                      'px-4 py-3 align-top border-b border-zinc-200 dark:border-zinc-800',
                      getCellClass(cell.column.id),
                    ]"
                  >
                    <div
                      :class="
                        cell.column.id === 'status' ? 'inline-flex' : 'w-full'
                      "
                    >
                      <FlexRender
                        :render="cell.column.columnDef.cell"
                        :props="cell.getContext()"
                      />
                    </div>
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
            />
            <div
              class="pointer-events-none absolute left-3 right-3 top-1/2 h-2 -translate-y-1/2 rounded-full bg-transparent"
              aria-hidden="true"
            >
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

        <div
          class="flex flex-col gap-3 pt-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between"
        >
          <span class="break-words"
            >{{ query.current }} / {{ totalPages }} ·
            {{ t("pages.myOrdersPage.summary.totalOrders") }}
            {{ orderData.total }}</span
          >
          <div
            class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="query.current <= 1 || loading"
                @click="handlePageChange(query.current - 1)"
              >
                {{ t("pages.myOrdersPage.pagination.prev") }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="query.current >= totalPages || loading"
                @click="handlePageChange(query.current + 1)"
              >
                {{ t("pages.myOrdersPage.pagination.next") }}
              </Button>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <Input v-model="jumpPage" class="w-20" :disabled="loading" />
              <Button
                variant="outline"
                size="sm"
                :disabled="loading"
                @click="handleJumpPage"
              >
                {{ t("pages.myOrdersPage.pagination.jump") }}
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
