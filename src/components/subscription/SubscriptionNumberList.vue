<script setup lang="ts">
defineOptions({ name: "SubscriptionNumberList" });

import { Button } from "@/components/ui/button";
import JyIcon from "@/components/JyIcon.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportComboOrderNumberApi, getUserComboOrderNumberListApi } from "@/api/auth";
import { toast } from "@/components/ui/toast";
import { ApiStatus } from "@/lib/status";
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { computed, h, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

type ComboCountryInfo = {
  id: string | number;
  name: string;
  code: string;
  flag?: string;
  phoneCode?: string;
};

type ComboInfo = {
  id: string | number;
  code?: string;
  name?: string;
  countryInfo?: ComboCountryInfo;
};

type SubscriptionNumberItem = {
  id?: string | number;
  orderNo?: string;
  phone?: string;
  mobile?: string;
  number?: string;
  imsi?: string;
  pkey?: string;
  status?: string | number;
  statusText?: string;
  numberStatusText?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  expireTime?: string;
  combo?: ComboInfo;
  packageName?: string;
  packageCode?: string;
  countryInfo?: ComboCountryInfo;
};

const props = withDefaults(
  defineProps<{
    orderNo?: string;
    compact?: boolean;
  }>(),
  {
    orderNo: "",
    compact: false,
  },
);

const { t } = useI18n();

const loading = ref(false);
const exportLoading = ref(false);
const jumpPage = ref("1");

const query = reactive({
  current: 1,
  size: 20,
  orderNo: "",
});

const numberData = ref<{
  list: SubscriptionNumberItem[];
  total: number;
}>({
  list: [],
  total: 0,
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil((numberData.value.total || 0) / query.size)),
);

const effectiveOrderNo = computed(() => String(props.orderNo || "").trim());
const isOrderNoLocked = computed(() => !!effectiveOrderNo.value);

const cleanAssetValue = (value?: string) =>
  String(value || "")
    .replace(/`/g, "")
    .trim();

const cleanDownloadUrl = (value?: string) => String(value || "").trim().replace(/^`|`$/g, "");

const triggerDownload = (url: string, fileName?: string) => {
  const link = document.createElement("a");
  link.href = url;
  if (fileName) {
    link.download = fileName;
  }
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const buildPayload = () => ({
  current: query.current,
  size: query.size,
  orderNo: query.orderNo.trim(),
});

const fetchNumbers = async () => {
  loading.value = true;
  try {
    const res = await getUserComboOrderNumberListApi(buildPayload());
    if (res.code === ApiStatus.success) {
      numberData.value = {
        list: res.data?.list || [],
        total: res.data?.total || 0,
      };
      jumpPage.value = String(query.current);
    }
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  query.current = 1;
  fetchNumbers();
};

const handleReset = () => {
  query.orderNo = effectiveOrderNo.value;
  query.current = 1;
  jumpPage.value = "1";
  fetchNumbers();
};

const handleExport = async () => {
  exportLoading.value = true;
  try {
    const res = await exportComboOrderNumberApi({
      orderNo: query.orderNo.trim(),
    });

    if (res.code === ApiStatus.success) {
      const fileUrl = cleanDownloadUrl(res.data?.fileUrl);
      const fileName = String(res.data?.fileName || "").trim();

      if (fileUrl) {
        triggerDownload(fileUrl, fileName);
      }

      toast({
        title: t("common.success"),
        description:
          res.msg || t("pages.subscriptionNumberList.export.successDescription"),
      });
      return;
    }

    toast({
      title: t("common.error"),
      description: res.msg || t("pages.subscriptionNumberList.export.failedDescription"),
      variant: "destructive",
    });
  } catch (error: unknown) {
    toast({
      title: t("common.error"),
      description:
        error instanceof Error
          ? error.message
          : t("pages.subscriptionNumberList.export.failedDescription"),
      variant: "destructive",
    });
  } finally {
    exportLoading.value = false;
  }
};

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value || page === query.current) return;
  query.current = page;
  fetchNumbers();
};

const handleJumpPage = () => {
  const page = Number(jumpPage.value);
  if (!Number.isInteger(page)) return;
  handlePageChange(page);
};

const getCellClass = (columnId: string) => {
  switch (columnId) {
    case "orderNo":
      return "w-[18%] whitespace-nowrap";
    case "phone":
      return "w-[20%]";
    case "imsi":
      return "w-[16%]";
    case "combo":
      return "w-[20%]";
    case "timeInfo":
      return "w-[18%] whitespace-nowrap";
    case "remark":
      return "w-[20%]";
    default:
      return "w-auto";
  }
};

const columnHelper = createColumnHelper<SubscriptionNumberItem>();
const columns = computed(() => [
  columnHelper.accessor("orderNo", {
    header: () => t("pages.subscriptionNumberList.table.orderNo"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.display({
    id: "phone",
    header: () => t("pages.subscriptionNumberList.table.phone"),
    cell: (info) => {
      const row = info.row.original;
      const phone = row.phone || row.mobile || row.number || "-";
      return h("div", { class: "space-y-1" }, [
        h("div", { class: "font-medium" }, phone),
        h(
          "div",
          { class: "text-xs text-muted-foreground break-all" },
          `PKEY: ${row.pkey || "-"}`,
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "combo",
    header: () => t("pages.subscriptionNumberList.table.combo"),
    cell: (info) => {
      const row = info.row.original;
      const combo = row.combo;
      const country = combo?.countryInfo || row.countryInfo;
      return h("div", { class: "space-y-1" }, [
        h(
          "div",
          { class: "font-medium truncate" },
          combo?.name || row.packageName || "-",
        ),
        h(
          "div",
          { class: "text-xs text-muted-foreground truncate" },
          `#${combo?.code || row.packageCode || "-"}`,
        ),
        h("div", { class: "flex items-center gap-2 text-xs text-muted-foreground" }, [
          country?.flag
            ? h(JyIcon, {
                name: cleanAssetValue(country.flag),
                class: "h-4 w-4 shrink-0 rounded-sm",
              })
            : null,
          h("span", { class: "truncate" }, `${country?.name || "-"} ${country?.phoneCode || ""}`),
        ]),
      ]);
    },
  }),
  columnHelper.accessor("imsi", {
    header: () => t("pages.subscriptionNumberList.table.imsi"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.display({
    id: "timeInfo",
    header: () => t("pages.subscriptionNumberList.table.timeInfo"),
    cell: (info) => {
      const row = info.row.original;
      return h("div", { class: "space-y-1 whitespace-nowrap" }, [
        h(
          "div",
          { class: "text-sm" },
          `${t("pages.subscriptionNumberList.table.createdAt")}: ${row.createdAt || "-"}`,
        ),
        h(
          "div",
          { class: "text-xs text-muted-foreground" },
          `${t("pages.subscriptionNumberList.table.expireTime")}: ${row.expireTime || "-"}`,
        ),
      ]);
    },
  }),
  columnHelper.accessor("remark", {
    header: () => t("pages.subscriptionNumberList.table.remark"),
    cell: (info) => info.getValue() || "-",
  }),
]);

const table = useVueTable({
  get data() {
    return numberData.value.list;
  },
  get columns() {
    return columns.value;
  },
  getCoreRowModel: getCoreRowModel(),
});

watch(
  () => props.orderNo,
  (value) => {
    query.orderNo = String(value || "").trim();
    query.current = 1;
    jumpPage.value = "1";
    fetchNumbers();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-4 min-w-0 w-full">
    <Card v-if="!compact">
      <CardHeader>
        <CardTitle>{{ t("pages.subscriptionNumberList.title") }}</CardTitle>
        <CardDescription>{{ t("pages.subscriptionNumberList.description") }}</CardDescription>
      </CardHeader>
    </Card>

    <Card class="min-w-0">
      <CardHeader>
        <CardTitle>{{ t("pages.subscriptionNumberList.filters.title") }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 min-w-0">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div class="space-y-2">
            <Label>{{ t("pages.subscriptionNumberList.filters.orderNo") }}</Label>
            <Input
              v-model="query.orderNo"
              :disabled="isOrderNoLocked || loading"
              :placeholder="t('pages.subscriptionNumberList.filters.orderNo')"
            />
          </div>

          <div class="flex flex-wrap items-end gap-2">
            <Button :disabled="loading" @click="handleSearch">
              {{ t("pages.subscriptionNumberList.filters.search") }}
            </Button>
            <Button variant="outline" :disabled="loading" @click="handleReset">
              {{ t("pages.subscriptionNumberList.filters.reset") }}
            </Button>
            <Button variant="outline" :disabled="loading || exportLoading" @click="handleExport">
              {{
                exportLoading
                  ? t("pages.subscriptionNumberList.export.loading")
                  : t("pages.subscriptionNumberList.export.button")
              }}
            </Button>
          </div>
        </div>

        <div
          class="relative rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-[320px]"
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

          <div class="w-full min-w-0 overflow-x-auto overflow-y-hidden">
            <table class="min-w-full table-fixed text-sm border-separate border-spacing-0">
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
                <tr v-if="!numberData.list.length && !loading">
                  <td
                    :colspan="columns.length"
                    class="px-4 py-10 text-center text-muted-foreground"
                  >
                    {{ t("pages.subscriptionNumberList.empty") }}
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
                    <div :class="cell.column.id === 'status' ? 'inline-flex' : 'w-full'">
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
        </div>

        <div
          class="flex flex-col gap-3 pt-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between"
        >
          <span class="break-words">
            {{ query.current }} / {{ totalPages }} ·
            {{ t("pages.subscriptionNumberList.summary.totalNumbers") }}
            {{ numberData.total }}
          </span>
          <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="query.current <= 1 || loading"
                @click="handlePageChange(query.current - 1)"
              >
                {{ t("pages.subscriptionNumberList.pagination.prev") }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="query.current >= totalPages || loading"
                @click="handlePageChange(query.current + 1)"
              >
                {{ t("pages.subscriptionNumberList.pagination.next") }}
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
                {{ t("pages.subscriptionNumberList.pagination.jump") }}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
