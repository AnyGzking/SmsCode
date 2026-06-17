<script setup lang="ts">
defineOptions({ name: "PackageOrders" });

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import JyIcon from "@/components/JyIcon.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SubscriptionNumberList from "@/components/subscription/SubscriptionNumberList.vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeComboOrderAutoRenewApi,
  getUserComboOrderListApi,
  refreshComboOrderTempTokenApi,
  renewComboOrderApi,
  saveCallbackApi,
} from "@/api/auth";
import { useCachedPageRequest } from "@/composables/useCachedPageRequest";
import { ApiStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import { usePublicStore } from "@/store/modules/public";
import { useUserStore } from "@/store/modules/user";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { toast } from "@/components/ui/toast";
import { Eye, EyeOff } from "lucide-vue-next";
import { computed, h, nextTick, onActivated, onMounted, reactive, ref } from "vue";
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
  code: string;
  name: string;
  type: number;
  duration: number;
  price: string | number;
  country: string | number;
  status: number;
  remark?: string;
  countryInfo?: ComboCountryInfo;
};

type PackageOrderItem = {
  id: string | number;
  orderNo: string;
  packageId: string | number;
  phoneNumCount: number;
  durationType: number;
  durationValue: number;
  subscribePrice: string | number;
  totalAmount: string | number;
  isAutoRenew: number;
  subscribeTime?: string;
  expireTime?: string;
  orderStatus: number;
  orderStatusText?: string;
  createdAt?: string;
  updatedAt?: string;
  remark?: string;
  tempToken?: string;
  combo?: ComboInfo;
};

const { t, locale } = useI18n();
const publicStore = usePublicStore();
const userStore = useUserStore();
const { markLoaded, shouldLoad } = useCachedPageRequest("package-orders-page");

const loading = ref(false);
const renewSubmitting = ref(false);
const callbackSaving = ref(false);
const autoRenewLoadingOrderNo = ref("");
const tempTokenRefreshingOrderNo = ref("");
const renewDialogOpen = ref(false);
const numberSheetOpen = ref(false);
const receiveDialogOpen = ref(false);
const viewingOrderNo = ref("");
const selectedRenewOrder = ref<PackageOrderItem | null>(null);
const jumpPage = ref("1");
const visibleTempTokens = ref<Record<string, boolean>>({});

const query = reactive({
  current: 1,
  size: 20,
  orderNo: "",
  status: "all",
});

const renewForm = reactive({
  numberCount: "1",
  duration: "1",
  autoRenew: false,
});

const callbackForm = reactive({
  callbackUrl: "",
});

const callbackUrl = computed(() => String(userStore.userInfo?.callbackUrl || "").trim());

const orderData = ref<{
  list: PackageOrderItem[];
  total: number;
}>({
  list: [],
  total: 0,
});

const currencyUnit = computed(() =>
  publicStore.getConfigItem("system", "currencyUnit", ""),
);

const renewUnitPrice = computed(() => {
  if (!selectedRenewOrder.value) return 0;
  const baseDuration = Math.max(1, Number(selectedRenewOrder.value.durationValue || 1));
  const price = Number(selectedRenewOrder.value.subscribePrice || 0);
  if (!Number.isFinite(price)) return 0;
  return price / baseDuration;
});

const selectedRenewDuration = computed(() => {
  const parsed = Number(renewForm.duration);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.max(1, Math.floor(parsed));
});

const selectedRenewNumberCount = computed(() => {
  const parsed = Number(renewForm.numberCount);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.max(1, Math.floor(parsed));
});

const renewTotalAmount = computed(() => {
  return renewUnitPrice.value * selectedRenewDuration.value * selectedRenewNumberCount.value;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil((orderData.value.total || 0) / query.size)),
);

const activeOrders = computed(() => {
  return orderData.value.list.filter((item) => Number(item.orderStatus) === 1).length;
});

const autoRenewOrders = computed(() => {
  return orderData.value.list.filter((item) => Number(item.isAutoRenew) === 1).length;
});

const totalAmount = computed(() => {
  return orderData.value.list.reduce(
    (sum, item) => sum + Number(item.totalAmount || 0),
    0,
  );
});

const statusOptions = computed(() => [
  { label: t("pages.packageOrdersPage.filters.all"), value: "all" },
  { label: t("pages.packageOrdersPage.statusOptions.0"), value: "0" },
  { label: t("pages.packageOrdersPage.statusOptions.1"), value: "1" },
  { label: t("pages.packageOrdersPage.statusOptions.2"), value: "2" },
  { label: t("pages.packageOrdersPage.statusOptions.3"), value: "3" },
]);

const getStatusLabel = (status: string | number) => {
  return (
    statusOptions.value.find((item) => item.value === String(status))?.label || "-"
  );
};

const cleanAssetValue = (value?: string) =>
  String(value || "")
    .replace(/`/g, "")
    .trim();

const formatPrice = (value: string | number) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return `0.0000${currencyUnit.value}`;
  return `${parsed.toFixed(4)}${currencyUnit.value}`;
};

const normalizeRenewForm = () => {
  renewForm.numberCount = String(selectedRenewNumberCount.value);
  renewForm.duration = String(selectedRenewDuration.value);
};

const formatDurationLabel = (value: string | number, type: string | number) => {
  const unitMap: Record<string, string> = {
    "1": t("pages.packageOrdersPage.durationTypes.day"),
    "2": t("pages.packageOrdersPage.durationTypes.month"),
    "3": t("pages.packageOrdersPage.durationTypes.year"),
  };
  const unit = unitMap[String(type)] || "-";
  const separator = ["zh", "ja", "ko"].includes(locale.value) ? "" : " ";
  return `${value || 0}${separator}${unit}`;
};

const autoRenewLabel = (value: string | number) => {
  return Number(value) === 1
    ? t("pages.packageOrdersPage.autoRenew.enabled")
    : t("pages.packageOrdersPage.autoRenew.disabled");
};

const statusBadgeClass = (status: string | number) => {
  switch (String(status)) {
    case "0":
      return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300";
    case "1":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    case "2":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
    case "3":
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
    default:
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
  }
};

const buildPayload = () => ({
  current: query.current,
  size: query.size,
  orderNo: query.orderNo.trim(),
  status: query.status === "all" ? "" : query.status,
});

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await getUserComboOrderListApi(buildPayload());
    if (res.code === ApiStatus.success) {
      orderData.value = {
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
  fetchOrders();
};

const handleReset = () => {
  query.orderNo = "";
  query.status = "all";
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

const openRenewDialog = (order: PackageOrderItem) => {
  selectedRenewOrder.value = order;
  renewForm.numberCount = String(Math.max(1, Number(order.phoneNumCount || 1)));
  renewForm.duration = String(Math.max(1, Number(order.durationValue || 1)));
  renewForm.autoRenew = Number(order.isAutoRenew) === 1;
  renewDialogOpen.value = true;
};

const openNumberSheet = (orderNo: string) => {
  viewingOrderNo.value = orderNo;
  numberSheetOpen.value = true;
};

const openReceiveDialog = () => {
  callbackForm.callbackUrl = callbackUrl.value;
  receiveDialogOpen.value = true;
};

const handleSaveCallback = async () => {
  callbackSaving.value = true;
  try {
    const res = await saveCallbackApi({
      callbackUrl: callbackForm.callbackUrl.trim(),
    });

    if (res.code === ApiStatus.success) {
      await userStore.refreshUserInfo();
      receiveDialogOpen.value = false;
      toast({
        title: t("common.success"),
        description: res.msg || t("pages.packageOrdersPage.messages.saveCallbackSuccess"),
      });
      return;
    }

    toast({
      title: t("common.error"),
      description: res.msg || t("pages.packageOrdersPage.messages.saveCallbackFailed"),
      variant: "destructive",
    });
  } catch (error: unknown) {
    toast({
      title: t("common.error"),
      description:
        error instanceof Error
          ? error.message
          : t("pages.packageOrdersPage.messages.saveCallbackFailed"),
      variant: "destructive",
    });
  } finally {
    callbackSaving.value = false;
  }
};

const handleAutoRenewChange = async (
  order: PackageOrderItem,
  checked: boolean | "indeterminate",
) => {
  if (checked === "indeterminate") return;
  autoRenewLoadingOrderNo.value = order.orderNo;
  try {
    const res = await changeComboOrderAutoRenewApi({
      orderNo: order.orderNo,
      isAutoRenew: checked ? 1 : 0,
    });
    if (res.code === ApiStatus.success) {
      order.isAutoRenew = checked ? 1 : 0;
      toast({
        title: t("common.success"),
        description: res.msg || t("pages.packageOrdersPage.messages.autoRenewUpdated"),
      });
      return;
    }

    toast({
      title: t("common.error"),
      description: res.msg || t("pages.packageOrdersPage.messages.autoRenewFailed"),
      variant: "destructive",
    });
  } catch (error: unknown) {
    toast({
      title: t("common.error"),
      description:
        error instanceof Error
          ? error.message
          : t("pages.packageOrdersPage.messages.autoRenewFailed"),
      variant: "destructive",
    });
  } finally {
    autoRenewLoadingOrderNo.value = "";
  }
};

const handleRenewOrder = async () => {
  if (!selectedRenewOrder.value) return;
  normalizeRenewForm();

  renewSubmitting.value = true;
  try {
    const payload = {
      orderNo: selectedRenewOrder.value.orderNo,
      packageId: selectedRenewOrder.value.packageId,
      comboId: selectedRenewOrder.value.combo?.id,
      comboType: selectedRenewOrder.value.durationType,
      phoneNumCount: selectedRenewNumberCount.value,
      durationValue: selectedRenewDuration.value,
      isAutoRenew: renewForm.autoRenew ? 1 : 0,
      combo: selectedRenewOrder.value.combo,
      order: selectedRenewOrder.value,
    };

    const res = await renewComboOrderApi(payload);
    if (res.code === ApiStatus.success) {
      renewDialogOpen.value = false;
      toast({
        title: t("common.success"),
        description: res.msg || t("pages.packageOrdersPage.messages.renewSuccess"),
      });
      await fetchOrders();
      return;
    }

    toast({
      title: t("common.error"),
      description: res.msg || t("pages.packageOrdersPage.messages.renewFailed"),
      variant: "destructive",
    });
  } catch (error: unknown) {
    toast({
      title: t("common.error"),
      description:
        error instanceof Error
          ? error.message
          : t("pages.packageOrdersPage.messages.renewFailed"),
      variant: "destructive",
    });
  } finally {
    renewSubmitting.value = false;
  }
};

const isTempTokenVisible = (orderNo: string) => {
  return !!visibleTempTokens.value[orderNo];
};

const toggleTempTokenVisible = (orderNo: string) => {
  visibleTempTokens.value = {
    ...visibleTempTokens.value,
    [orderNo]: !visibleTempTokens.value[orderNo],
  };
};

const formatTempToken = (order: PackageOrderItem) => {
  const value = String(order.tempToken || "");
  if (!value) return "-";
  if (isTempTokenVisible(order.orderNo)) return value;
  return "•".repeat(Math.min(Math.max(value.length, 8), 24));
};

const handleRefreshTempToken = async (order: PackageOrderItem) => {
  tempTokenRefreshingOrderNo.value = order.orderNo;
  try {
    const res = await refreshComboOrderTempTokenApi({
      orderNo: order.orderNo,
    });

    if (res.code === ApiStatus.success) {
      const nextToken =
        res.data?.tempToken ||
        res.data?.token ||
        res.tempToken ||
        res.token ||
        "";
      if (nextToken) {
        order.tempToken = nextToken;
      }
      visibleTempTokens.value = {
        ...visibleTempTokens.value,
        [order.orderNo]: true,
      };
      toast({
        title: t("common.success"),
        description: res.msg || t("pages.packageOrdersPage.messages.tempTokenRefreshSuccess"),
      });
      return;
    }

    toast({
      title: t("common.error"),
      description: res.msg || t("pages.packageOrdersPage.messages.tempTokenRefreshFailed"),
      variant: "destructive",
    });
  } catch (error: unknown) {
    toast({
      title: t("common.error"),
      description:
        error instanceof Error
          ? error.message
          : t("pages.packageOrdersPage.messages.tempTokenRefreshFailed"),
      variant: "destructive",
    });
  } finally {
    tempTokenRefreshingOrderNo.value = "";
  }
};

const getCellClass = (columnId: string) => {
  switch (columnId) {
    case "orderNo":
      return "w-[10%] whitespace-nowrap align-top";
    case "combo":
      return "w-[10%] align-top";
    case "duration":
      return "w-[7%] whitespace-nowrap align-top";
    case "phoneNumCount":
      return "w-[6%] whitespace-nowrap align-top text-center";
    case "price":
      return "w-[9%] whitespace-nowrap align-top";
    case "status":
      return "w-[7%] whitespace-nowrap align-top";
    case "autoRenew":
      return "w-[9%] whitespace-nowrap align-top";
    case "tempToken":
      return "w-[13%] align-top";
    case "actions":
      return "w-[14%] whitespace-nowrap align-top";
    case "timeInfo":
      return "w-[17%] whitespace-nowrap align-top";
    default:
      return "w-auto";
  }
};

const columnHelper = createColumnHelper<PackageOrderItem>();
const columns = computed(() => [
  columnHelper.accessor("orderNo", {
    header: () => t("pages.packageOrdersPage.table.orderNo"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.display({
    id: "combo",
    header: () => t("pages.packageOrdersPage.table.combo"),
    cell: (info) => {
      const row = info.row.original;
      const combo = row.combo;
      const country = combo?.countryInfo;
      if (!combo) return "-";
      return h("div", { class: "space-y-1" }, [
        h("div", { class: "font-medium truncate" }, combo.name || "-"),
        h("div", { class: "text-xs text-muted-foreground truncate" }, `#${combo.code || "-"}`),
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
  columnHelper.display({
    id: "duration",
    header: () => t("pages.packageOrdersPage.table.duration"),
    cell: (info) => {
      const row = info.row.original;
      return formatDurationLabel(row.durationValue, row.durationType);
    },
  }),
  columnHelper.accessor("phoneNumCount", {
    header: () => t("pages.packageOrdersPage.table.phoneNumCount"),
    cell: (info) => info.getValue() || 0,
  }),
  columnHelper.display({
    id: "price",
    header: () => t("pages.packageOrdersPage.table.amount"),
    cell: (info) => {
      const row = info.row.original;
      return h("div", { class: "space-y-1 whitespace-nowrap" }, [
        h("div", { class: "font-medium text-primary" }, formatPrice(row.totalAmount)),
        h(
          "div",
          { class: "text-xs text-muted-foreground" },
          `${t("pages.packageOrdersPage.table.unitPrice")}: ${formatPrice(row.subscribePrice)}`,
        ),
      ]);
    },
  }),
  columnHelper.accessor("orderStatus", {
    header: () => t("pages.packageOrdersPage.table.status"),
    cell: (info) => {
      const status = info.getValue();
      return h(
        Badge,
        {
          variant: "outline",
          class: cn("whitespace-nowrap", statusBadgeClass(status)),
        },
        () => getStatusLabel(status),
      );
    },
  }),
  columnHelper.accessor("isAutoRenew", {
    header: () => t("pages.packageOrdersPage.table.autoRenew"),
    cell: (info) => {
      const row = info.row.original;
      return h("div", { class: "flex items-center gap-2" }, [
        h(Switch, {
          checked: Number(row.isAutoRenew) === 1,
          disabled: autoRenewLoadingOrderNo.value === row.orderNo,
          "onUpdate:checked": (value: boolean | "indeterminate") =>
            handleAutoRenewChange(row, value),
        }),
        h(
          "span",
          { class: "text-xs text-muted-foreground whitespace-nowrap" },
          autoRenewLabel(info.getValue()),
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "tempToken",
    header: () => t("pages.packageOrdersPage.table.tempToken"),
    cell: (info) => {
      const row = info.row.original;
      return h("div", { class: "flex items-center gap-2" }, [
        h(
          "code",
          {
            class:
              "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-muted px-2 py-1 text-xs",
            title: String(row.tempToken || "-"),
          },
          formatTempToken(row),
        ),
        h(
          Button,
          {
            variant: "ghost",
            size: "icon",
            class: "h-8 w-8 shrink-0",
            onClick: () => toggleTempTokenVisible(row.orderNo),
          },
          () =>
            isTempTokenVisible(row.orderNo)
              ? h(EyeOff, { class: "h-4 w-4" })
              : h(Eye, { class: "h-4 w-4" }),
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "timeInfo",
    header: () => t("pages.packageOrdersPage.table.timeInfo"),
    cell: (info) => {
      const row = info.row.original;
      return h("div", { class: "space-y-1 whitespace-nowrap" }, [
        h(
          "div",
          { class: "text-sm" },
          `${t("pages.packageOrdersPage.table.subscribeTime")}: ${row.subscribeTime || "-"}`,
        ),
        h(
          "div",
          { class: "text-xs text-muted-foreground" },
          `${t("pages.packageOrdersPage.table.expireTime")}: ${row.expireTime || "-"}`,
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => t("pages.packageOrdersPage.table.actions"),
    cell: (info) => {
      const row = info.row.original;
      return h("div", { class: "flex flex-wrap gap-2" }, [
        h(
          Button,
          {
            variant: "outline",
            size: "sm",
            disabled: renewSubmitting.value,
            onClick: () => openRenewDialog(row),
          },
          () => t("pages.packageOrdersPage.actions.renew"),
        ),
        h(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => openNumberSheet(row.orderNo),
          },
          () => t("pages.packageOrdersPage.actions.viewNumbers"),
        ),
        h(
          Button,
          {
            variant: "outline",
            size: "sm",
            disabled: tempTokenRefreshingOrderNo.value === row.orderNo,
            onClick: () => handleRefreshTempToken(row),
          },
          () => [
            t("pages.packageOrdersPage.actions.refreshTempToken"),
          ],
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
  if (shouldLoad()) {
    await fetchOrders();
    markLoaded();
  }
  await nextTick();
});

onActivated(async () => {
  await nextTick();
});
</script>

<template>
  <div class="space-y-6 min-w-0 w-full">
    <Card>
      <CardHeader>
        <CardTitle>{{ t("pages.packageOrdersPage.title") }}</CardTitle>
        <CardDescription>{{
          t("pages.packageOrdersPage.description")
        }}</CardDescription>
      </CardHeader>
    </Card>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>{{ t("pages.packageOrdersPage.summary.totalOrders") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold break-all">{{ orderData.total }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{{ t("pages.packageOrdersPage.summary.activeOrders") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold break-all">{{ activeOrders }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{{ t("pages.packageOrdersPage.summary.autoRenewOrders") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold break-all">{{ autoRenewOrders }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{{ t("pages.packageOrdersPage.summary.totalAmount") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold break-all">
            {{ formatPrice(totalAmount) }}
          </p>
        </CardContent>
      </Card>
    </div>

    <Card class="min-w-0">
      <CardHeader>
        <CardTitle>{{ t("navigation.packageOrders") }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 min-w-0">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="space-y-2">
            <Label>{{ t("pages.packageOrdersPage.filters.orderNo") }}</Label>
            <Input v-model="query.orderNo" />
          </div>

          <div class="space-y-2">
            <Label>{{ t("pages.packageOrdersPage.filters.status") }}</Label>
            <Select v-model="query.status">
              <SelectTrigger>
                <SelectValue
                  :placeholder="t('pages.packageOrdersPage.filters.status')"
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

          <div class="flex flex-wrap items-end gap-2">
            <Button @click="handleSearch">
              {{ t("pages.packageOrdersPage.filters.search") }}
            </Button>
            <Button variant="outline" @click="handleReset">
              {{ t("pages.packageOrdersPage.filters.reset") }}
            </Button>
            <Button variant="outline" @click="openReceiveDialog">
              {{ t("pages.packageOrdersPage.actions.receive") }}
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
                <tr v-if="!orderData.list.length && !loading">
                  <td
                    :colspan="columns.length"
                    class="px-4 py-10 text-center text-muted-foreground"
                  >
                    {{ t("pages.packageOrdersPage.empty") }}
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
            {{ t("pages.packageOrdersPage.summary.totalOrders") }}
            {{ orderData.total }}
          </span>
          <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="query.current <= 1 || loading"
                @click="handlePageChange(query.current - 1)"
              >
                {{ t("pages.packageOrdersPage.pagination.prev") }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="query.current >= totalPages || loading"
                @click="handlePageChange(query.current + 1)"
              >
                {{ t("pages.packageOrdersPage.pagination.next") }}
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
                {{ t("pages.packageOrdersPage.pagination.jump") }}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="renewDialogOpen">
      <DialogContent class="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{{ t("pages.packageOrdersPage.renewDialog.title") }}</DialogTitle>
          <DialogDescription>
            {{ t("pages.packageOrdersPage.renewDialog.description") }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedRenewOrder" class="space-y-5">
          <div class="rounded-2xl border bg-muted/30 p-4">
            <div class="text-base font-semibold">
              {{ selectedRenewOrder.combo?.name || "-" }}
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              #{{ selectedRenewOrder.orderNo }} ·
              {{ selectedRenewOrder.combo?.countryInfo?.name || "-" }}
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label>{{ t("pages.packageOrdersPage.renewDialog.numberCount") }}</Label>
              <Input
                :model-value="String(selectedRenewNumberCount)"
                readonly
                disabled
              />
            </div>

            <div class="space-y-2">
              <Label>{{ t("pages.packageOrdersPage.renewDialog.duration") }}</Label>
              <div class="flex items-center gap-2">
                <Input
                  v-model="renewForm.duration"
                  type="number"
                  min="1"
                  :disabled="renewSubmitting"
                  @blur="normalizeRenewForm"
                />
                <div class="shrink-0 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {{
                    formatDurationLabel(
                      1,
                      selectedRenewOrder.durationType,
                    ).replace(/^1/, "")
                  }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between rounded-2xl border px-4 py-3">
            <div>
              <div class="text-sm font-medium">
                {{ t("pages.packageOrdersPage.renewDialog.autoRenew") }}
              </div>
              <div class="text-sm text-muted-foreground">
                {{ t("pages.packageOrdersPage.renewDialog.autoRenewHint") }}
              </div>
            </div>
            <Switch v-model:checked="renewForm.autoRenew" :disabled="renewSubmitting" />
          </div>

          <div class="space-y-3 rounded-2xl border bg-background p-4">
            <div class="text-sm font-medium">
              {{ t("pages.packageOrdersPage.renewDialog.summary") }}
            </div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-muted-foreground">
                {{ t("pages.packageOrdersPage.renewDialog.plan") }}
              </span>
              <span class="text-right">
                {{ selectedRenewOrder.combo?.name || "-" }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-muted-foreground">
                {{ t("pages.packageOrdersPage.renewDialog.unitPrice") }}
              </span>
              <span class="text-right">{{ formatPrice(renewUnitPrice) }}</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-muted-foreground">
                {{ t("pages.packageOrdersPage.renewDialog.duration") }}
              </span>
              <span class="text-right">
                {{
                  formatDurationLabel(
                    selectedRenewDuration,
                    selectedRenewOrder.durationType,
                  )
                }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-muted-foreground">
                {{ t("pages.packageOrdersPage.renewDialog.numberCount") }}
              </span>
              <span class="text-right">{{ selectedRenewNumberCount }}</span>
            </div>
            <div class="flex items-center justify-between gap-4 border-t pt-3 text-base font-semibold">
              <span>{{ t("pages.packageOrdersPage.renewDialog.totalPrice") }}</span>
              <span class="text-primary">{{ formatPrice(renewTotalAmount) }}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            :disabled="renewSubmitting"
            @click="renewDialogOpen = false"
          >
            {{ t("common.cancel") }}
          </Button>
          <Button
            class="bg-[#42b883] text-white hover:bg-[#42b883]/90"
            :disabled="renewSubmitting || !selectedRenewOrder"
            @click="handleRenewOrder"
          >
            {{
              renewSubmitting
                ? t("pages.packageOrdersPage.renewDialog.submitting")
                : t("pages.packageOrdersPage.actions.renew")
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Sheet v-model:open="numberSheetOpen">
      <SheetContent side="right" class="w-screen sm:w-[60vw] sm:max-w-none overflow-y-auto p-0">
        <div class="space-y-0">
          <SheetHeader class="border-b px-6 py-5 text-left">
            <SheetTitle>{{ t("pages.packageOrdersPage.numberSheet.title") }}</SheetTitle>
            <SheetDescription>
              {{
                t("pages.packageOrdersPage.numberSheet.description")
              }}
            </SheetDescription>
          </SheetHeader>
          <div class="p-6">
            <SubscriptionNumberList :order-no="viewingOrderNo" compact />
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <Dialog v-model:open="receiveDialogOpen">
      <DialogContent class="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{{ t("pages.packageOrdersPage.receiveDialog.title") }}</DialogTitle>
          <DialogDescription>
            {{ t("pages.packageOrdersPage.receiveDialog.description") }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-2">
          <Label>{{ t("pages.packageOrdersPage.receiveDialog.callbackUrl") }}</Label>
          <Input
            v-model="callbackForm.callbackUrl"
            :placeholder="t('pages.packageOrdersPage.receiveDialog.placeholder')"
            :disabled="callbackSaving"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="callbackSaving" @click="receiveDialogOpen = false">
            {{ t("common.cancel") }}
          </Button>
          <Button :disabled="callbackSaving" @click="handleSaveCallback">
            {{
              callbackSaving
                ? t("pages.packageOrdersPage.receiveDialog.saving")
                : t("pages.packageOrdersPage.receiveDialog.save")
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
