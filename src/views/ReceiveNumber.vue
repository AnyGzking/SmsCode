<script setup lang="ts">
defineOptions({
  name: "ReceiveNumber",
});

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import JyIcon from "@/components/JyIcon.vue";
import SafeImg from "@/components/ui/img/SafeImg.vue";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { RefreshCw } from "lucide-vue-next";
import {
  addBlackApi,
  getPhoneApi,
  getPhoneCodeApi,
  setRelApi,
} from "@/api/auth";
import { useCachedPageRequest } from "@/composables/useCachedPageRequest";
import { ApiStatus } from "@/lib/status";
import { useDictionaryStore } from "@/store/modules/dictionary";
import { cn } from "@/lib/utils";
import { computed, nextTick, onActivated, onMounted, onUnmounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { usePublicStore } from "@/store/modules/public";

const { t } = useI18n();

type ProjectItem = {
  id: string | number;
  name: string;
  code: string;
  price: number;
  icon?: string;
};

type CountryItem = {
  id: string | number;
  name: string;
  code: string;
  flag?: string;
  phoneCode?: string;
};

type ChannelConfig = {
  price: number;
  supportType: number;
  supportCountryIds: string[];
  countryPrices: Record<string, string>;
  userPrices: Record<string, string>;
  supplierId: string;
  projectChannelId: string;
};

type PhoneDataType = {
  pkey: string;
  getTime: string;
  country: string;
  countryTel: string;
  dock: string;
  phone: string;
  port: string;
  time: number;
  orderNo?: string;
};

type PhoneRecordType = PhoneDataType & {
  codeNum: string;
  smsContent: string;
  createTime: string;
  status: "polling" | "success";
};

const publicStore = usePublicStore();
const dictionaryStore = useDictionaryStore();
const { markLoaded, shouldLoad } = useCachedPageRequest("receive-number-page");
const currencyUnit = computed(() =>
  publicStore.getConfigItem("system", "currencyUnit", ""),
);

const globalLoading = ref(false);
const submitLoading = ref(false);
const pollingLoading = ref(false);
const refreshProjectsLoading = ref(false);
const recordActionLoading = ref<string>("");
const countdown = ref(10);
const projectKeyword = ref("");
const countryKeyword = ref("");
const isRequestingCode = ref(false);
const phoneRecords = ref<PhoneRecordType[]>([]);
const currentPhone = ref<PhoneDataType | null>(null);
const projectOriginList = ref<ProjectItem[]>([]);
const countryOriginList = ref<CountryItem[]>([]);
const projects = ref<ProjectItem[]>([]);
const countries = ref<CountryItem[]>([]);
const channelConfig = ref<ChannelConfig | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

const form = reactive({
  projectId: "",
  countryId: "",
  msgType: "all",
  mobile: "",
});

const messageTypeOptions = computed(() => [
  { value: "all", label: t("pages.receiveNumberPage.form.types.all") },
  { value: "sms", label: t("pages.receiveNumberPage.form.types.sms") },
  { value: "voice", label: t("pages.receiveNumberPage.form.types.voice") },
  { value: "incall", label: t("pages.receiveNumberPage.form.types.incall") },
]);

const filteredProjects = computed(() => {
  const keyword = projectKeyword.value.trim().toLowerCase();
  if (!keyword) return projects.value;
  return projects.value.filter((project) => {
    return [project.name, project.code, project.id]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(keyword));
  });
});

const filteredCountries = computed(() => {
  const keyword = countryKeyword.value.trim().toLowerCase();
  if (!keyword) return countries.value;
  return countries.value.filter((country) => {
    return [country.name, country.code, country.phoneCode, country.id]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(keyword));
  });
});

const selectedProject = computed(() => {
  return projects.value.find(
    (item) => String(item.id) === String(form.projectId),
  );
});

const selectedCountry = computed(() => {
  return countries.value.find(
    (item) => String(item.id) === String(form.countryId),
  );
});

const selectedProjectLabel = computed(() => {
  if (!selectedProject.value)
    return t("pages.receiveNumberPage.form.placeholders.project");
  return `${selectedProject.value.name} / ${selectedProject.value.code}`;
});

const selectedCountryLabel = computed(() => {
  if (!selectedCountry.value)
    return t("pages.receiveNumberPage.form.placeholders.country");
  return `${selectedCountry.value.name} / ${selectedCountry.value.phoneCode || ""}`;
});

const currentPhoneCards = computed(() => {
  if (!currentPhone.value) return [];
  return [
    {
      key: "country",
      label: t("pages.receiveNumberPage.currentPhone.country"),
      value: currentPhone.value.country || "-",
    },
    {
      key: "countryTel",
      label: t("pages.receiveNumberPage.currentPhone.countryTel"),
      value: currentPhone.value.countryTel
        ? `+${currentPhone.value.countryTel}`
        : "-",
    },
    {
      key: "port",
      label: t("pages.receiveNumberPage.currentPhone.port"),
      value: currentPhone.value.port || "-",
    },
    {
      key: "getTime",
      label: t("pages.receiveNumberPage.currentPhone.getTime"),
      value: currentPhone.value.getTime || "-",
    },
    {
      key: "pkey",
      label: t("pages.receiveNumberPage.currentPhone.pkey"),
      value: currentPhone.value.pkey || "-",
    },
    {
      key: "dock",
      label: t("pages.receiveNumberPage.currentPhone.dock"),
      value: currentPhone.value.dock || "-",
    },
  ];
});

const activePhoneRecord = computed(() => {
  return phoneRecords.value.find((item) => item.status === "polling") || null;
});

const cleanAssetValue = (value?: string | null) => {
  return String(value || "")
    .replace(/`/g, "")
    .trim();
};

const filterCountriesByChannel = () => {
  if (!channelConfig.value) {
    countries.value = [];
    return;
  }

  if (Number(channelConfig.value.supportType) === 1) {
    countries.value = [...countryOriginList.value];
    return;
  }

  const supportIds = (channelConfig.value.supportCountryIds || []).map(String);
  countries.value = countryOriginList.value.filter((item) =>
    supportIds.includes(String(item.id)),
  );
};

const formatPrice = (value: string | number) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return "0.0000";
  return parsed.toFixed(4);
};

const getCountryPrice = (countryId: string | number) => {
  if (!channelConfig.value)
    return formatPrice(selectedProject.value?.price || 0);

  const idStr = String(countryId);
  if (channelConfig.value.userPrices?.[idStr])
    return formatPrice(channelConfig.value.userPrices[idStr]);
  if (channelConfig.value.countryPrices?.[idStr])
    return formatPrice(channelConfig.value.countryPrices[idStr]);
  return formatPrice(channelConfig.value.price || 0);
};

const statusBadgeClass = (kind: "success" | "danger" | "info") => {
  switch (kind) {
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    case "danger":
      return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
    default:
      return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300";
  }
};

const upsertPhoneRecord = (record: PhoneRecordType) => {
  const existingIndex = phoneRecords.value.findIndex(
    (item) => item.pkey === record.pkey,
  );

  if (existingIndex >= 0) {
    phoneRecords.value[existingIndex] = {
      ...phoneRecords.value[existingIndex],
      ...record,
    };
    return;
  }

  phoneRecords.value.unshift(record);
};

const handleTypeChange = (value: string) => {
  form.msgType = value;
};

const handleProjectChange = async (projectId: string) => {
  form.projectId = projectId;
  form.countryId = "";
  channelConfig.value = null;
  countries.value = [];

  if (!projectId) return;

  globalLoading.value = true;
  try {
    const config = await dictionaryStore.fetchProjectChannel(projectId);
    if (config) {
      channelConfig.value = config;
      filterCountriesByChannel();
      return;
    }

    toast({
      title: t("common.error"),
      description:
        t("pages.receiveNumberPage.messages.loadProjectConfigFailed"),
      variant: "destructive",
    });
  } catch (error: unknown) {
    toast({
      title: t("common.error"),
      description:
        error instanceof Error
          ? error.message
          : t("pages.receiveNumberPage.messages.loadProjectConfigFailed"),
      variant: "destructive",
    });
  } finally {
    globalLoading.value = false;
  }
};

const handleRefreshProjects = async () => {
  refreshProjectsLoading.value = true;
  try {
    await dictionaryStore.fetchProjects(true);
    projectOriginList.value = dictionaryStore.projects as ProjectItem[];
    projects.value = [...projectOriginList.value];
    projectKeyword.value = "";
    if (form.projectId) {
      await handleProjectChange(String(form.projectId));
    }
    await nextTick();
    toast({
      title: t("pages.receiveNumberPage.messages.refreshProjectSuccessTitle"),
      description: t("pages.receiveNumberPage.messages.refreshProjectSuccessDescription"),
    });
  } catch (error: unknown) {
    toast({
      title: t("common.error"),
      description:
        error instanceof Error
          ? error.message
          : t("pages.receiveNumberPage.messages.refreshProjectFailedDescription"),
      variant: "destructive",
    });
  } finally {
    refreshProjectsLoading.value = false;
  }
};

const initTimer = () => {
  countdown.value = 10;
  if (timer) clearInterval(timer);
  timer = setInterval(async () => {
    if (countdown.value > 0) {
      countdown.value -= 1;
      return;
    }

    countdown.value = 10;
    if (!isRequestingCode.value) {
      await autoGetCodeAction();
    }
  }, 1000);
};

const autoGetCodeAction = async () => {
  const targetRecord = activePhoneRecord.value;
  if (!targetRecord?.pkey || !form.projectId || !form.countryId) return;

  const selectedCountryItem = countryOriginList.value.find(
    (item) => String(item.id) === String(form.countryId),
  );
  if (!selectedCountryItem) return;

  isRequestingCode.value = true;
  pollingLoading.value = true;
  const params = {
    // ...targetRecord,
    // projectId: form.projectId,
    // countryId: form.countryId,
    // supplierId: channelConfig.value?.supplierId,
    // projectChannelId: channelConfig.value?.projectChannelId,
    // countryCode: selectedCountryItem.code,
    // price: getCountryPrice(form.countryId),
    // mobile: form.mobile.trim(),
    phone: targetRecord.phone,
    pkey: targetRecord.pkey,
    orderNo: targetRecord.orderNo,
  };

  try {
    const res = await getPhoneCodeApi(params);
    if (res.code === ApiStatus.success) {
      upsertPhoneRecord({
        ...targetRecord,
        codeNum: res.data.codeNum,
        smsContent: res.data.smsContent,
        status: "success",
      });
      currentPhone.value = {
        ...targetRecord,
      };
      if (timer) clearInterval(timer);
      timer = null;
      countdown.value = 10;
      toast({
        title: t("pages.receiveNumberPage.messages.codeSuccessTitle"),
        description: t(
          "pages.receiveNumberPage.messages.codeSuccessDescription",
        ),
      });
      return;
    }

    const silentMessage = t(
      "pages.receiveNumberPage.messages.waitingCodeSilent",
    );
    if ((res.msg || "") != silentMessage) {
      toast({
        title: t("common.error"),
        description:
          res.msg ||
          t("pages.receiveNumberPage.messages.codeFailedDescription"),
        variant: "destructive",
      });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : t("pages.receiveNumberPage.messages.codeFailedDescription");
    if (message !== t("pages.receiveNumberPage.messages.waitingCodeSilent")) {
      toast({
        title: t("common.error"),
        description: message,
        variant: "destructive",
      });
    }
  } finally {
    isRequestingCode.value = false;
    pollingLoading.value = false;
  }
};

const handleGetPhone = async () => {
  if (!form.projectId) {
    toast({
      title: t("common.error"),
      description: t("pages.receiveNumberPage.messages.selectProject"),
      variant: "destructive",
    });
    return;
  }

  if (!form.countryId) {
    toast({
      title: t("common.error"),
      description: t("pages.receiveNumberPage.messages.selectCountry"),
      variant: "destructive",
    });
    return;
  }

  const selectedCountryItem = countryOriginList.value.find(
    (item) => String(item.id) === String(form.countryId),
  );
  if (!selectedCountryItem) {
    toast({
      title: t("common.error"),
      description: t("pages.receiveNumberPage.messages.countryDataMissing"),
      variant: "destructive",
    });
    return;
  }

  submitLoading.value = true;
  try {
    const res = await getPhoneApi({
      projectId: form.projectId,
      countryId: form.countryId,
      type: form.msgType === "all" ? [] : [form.msgType],
      mobile: form.mobile.trim(),
    });

    if (res.code === ApiStatus.success) {
      currentPhone.value = res.data;
      upsertPhoneRecord({
        ...res.data,
        codeNum: "",
        smsContent: "",
        createTime: res.data.getTime || new Date().toLocaleString(),
        status: "polling",
      });
      initTimer();
      toast({
        title: t("pages.receiveNumberPage.messages.phoneSuccessTitle"),
        description: t(
          "pages.receiveNumberPage.messages.phoneSuccessDescription",
        ),
      });
      return;
    }

    toast({
      title: t("common.error"),
      description:
        res.msg || t("pages.receiveNumberPage.messages.phoneFailedDescription"),
      variant: "destructive",
    });
  } catch (error: unknown) {
    toast({
      title: t("common.error"),
      description:
        error instanceof Error
          ? error.message
          : t("pages.receiveNumberPage.messages.phoneFailedDescription"),
      variant: "destructive",
    });
  } finally {
    submitLoading.value = false;
  }
};

const handleRecordAction = async (
  type: "black" | "release",
  row: PhoneRecordType,
) => {
  recordActionLoading.value = `${type}-${row.pkey}`;
  try {
    const requestPayload = {
      // ...row,
      pkey: row.pkey,
      phone: row.phone,
      // projectId: form.projectId,
      orderNo: row.orderNo,
    };

    const res =
      type === "black"
        ? await addBlackApi(requestPayload)
        : await setRelApi(requestPayload);

    if (res.code === ApiStatus.success) {
      if (currentPhone.value?.pkey === row.pkey) {
        currentPhone.value = null;
      }
      if (type === "release") {
        phoneRecords.value = phoneRecords.value.filter(
          (item) => item.pkey !== row.pkey,
        );
      }
      if (activePhoneRecord.value?.pkey === row.pkey) {
        if (timer) clearInterval(timer);
        timer = null;
        countdown.value = 10;
      }
      toast({
        title:
          type === "black"
            ? t("pages.receiveNumberPage.messages.blackSuccessTitle")
            : t("pages.receiveNumberPage.messages.releaseSuccessTitle"),
        description:
          type === "black"
            ? t("pages.receiveNumberPage.messages.blackSuccessDescription")
            : t("pages.receiveNumberPage.messages.releaseSuccessDescription"),
      });

      if (type === "black") {
        const target = phoneRecords.value.find((item) => item.pkey === row.pkey);
        if (target) {
          target.status = "success";
        }
      }
      return;
    }

    toast({
      title: t("common.error"),
      description:
        res.msg ||
        (type === "black"
          ? t("pages.receiveNumberPage.messages.blackFailedDescription")
          : t("pages.receiveNumberPage.messages.releaseFailedDescription")),
      variant: "destructive",
    });
  } catch (error: unknown) {
    toast({
      title: t("common.error"),
      description: error instanceof Error ? error.message : t("common.error"),
      variant: "destructive",
    });
  } finally {
    recordActionLoading.value = "";
  }
};

const initData = async () => {
  globalLoading.value = true;
  try {
    await dictionaryStore.ensureBaseDictionaries();
    projectOriginList.value = dictionaryStore.projects as ProjectItem[];
    countryOriginList.value = dictionaryStore.countries as CountryItem[];
    projects.value = [...projectOriginList.value];
    countries.value = [...countryOriginList.value];
    markLoaded();
  } finally {
    globalLoading.value = false;
  }
};

onMounted(() => {
  if (shouldLoad()) {
    initData();
    return;
  }

  projectOriginList.value = dictionaryStore.projects as ProjectItem[];
  countryOriginList.value = dictionaryStore.countries as CountryItem[];
  projects.value = [...projectOriginList.value];
  countries.value = [...countryOriginList.value];
});

onActivated(() => {
  projectOriginList.value = dictionaryStore.projects as ProjectItem[];
  countryOriginList.value = dictionaryStore.countries as CountryItem[];
  projects.value = [...projectOriginList.value];
  if (!channelConfig.value) {
    countries.value = [...countryOriginList.value];
    return;
  }
  filterCountriesByChannel();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="space-y-6 min-w-0 w-full">
    <Card>
      <CardHeader>
        <CardTitle>{{ t("pages.receiveNumberPage.title") }}</CardTitle>
        <CardDescription>{{
          t("pages.receiveNumberPage.description")
        }}</CardDescription>
      </CardHeader>
    </Card>

    <div
      class="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
    >
      <Card class="min-w-0">
        <CardHeader>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{{ t("pages.receiveNumberPage.form.title") }}</CardTitle>
            <Button
              variant="outline"
              size="icon"
              :disabled="refreshProjectsLoading || globalLoading"
              @click="handleRefreshProjects"
            >
              <RefreshCw class="h-4 w-4" :class="refreshProjectsLoading ? 'animate-spin' : ''" />
            </Button>
          </div>
          <CardDescription>{{
            t("pages.receiveNumberPage.form.description")
          }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div class="space-y-2">
            <Label>{{ t("pages.receiveNumberPage.form.project") }}</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="outline" class="w-full justify-between">
                  <span class="truncate">{{ selectedProjectLabel }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                class="w-[min(450px,calc(100vw-2rem))] min-w-[340px] max-w-[450px] p-3"
                align="start"
              >
                <div class="space-y-3">
                  <Input
                    v-model="projectKeyword"
                    :placeholder="
                      t(
                        'pages.receiveNumberPage.form.placeholders.searchProject',
                      )
                    "
                  />
                  <div class="max-h-64 space-y-2 overflow-y-auto">
                    <button
                      v-for="project in filteredProjects"
                      :key="project.id"
                      type="button"
                      class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                      @click="handleProjectChange(String(project.id))"
                    >
                      <SafeImg
                        v-if="project.icon"
                        :src="cleanAssetValue(project.icon)"
                        :alt="project.name"
                        class="h-7 w-7 shrink-0 rounded-md object-contain"
                      />
                      <div class="min-w-0 flex-1">
                        <div class="truncate font-medium">
                          {{ project.name }}
                        </div>
                        <div class="truncate text-xs text-muted-foreground">
                          {{ project.code }}
                        </div>
                      </div>
                      <div class="text-right text-xs text-muted-foreground">
                        <div>{{ project.id }}</div>
                        <div>
                          {{ t("pages.receiveNumberPage.form.minPrice")
                          }}{{ formatPrice(project.price) }}{{ currencyUnit }}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div class="space-y-2">
            <Label>{{ t("pages.receiveNumberPage.form.country") }}</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="w-full justify-between"
                  :disabled="!channelConfig"
                >
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
                    :placeholder="
                      t(
                        'pages.receiveNumberPage.form.placeholders.searchCountry',
                      )
                    "
                  />
                  <div class="max-h-64 space-y-2 overflow-y-auto">
                    <button
                      v-for="country in filteredCountries"
                      :key="country.id"
                      type="button"
                      class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                      @click="form.countryId = String(country.id)"
                    >
                      <JyIcon
                        v-if="country.flag"
                        :name="cleanAssetValue(country.flag)"
                        class="h-8 w-8 shrink-0 rounded-sm"
                      />
                      <div class="min-w-0 flex-1">
                        <div class="truncate font-medium">
                          {{ country.name }}
                        </div>
                        <div class="truncate text-xs text-muted-foreground">
                          {{ country.code }} · ID: {{ country.id }}
                        </div>
                      </div>
                      <div
                        class="shrink-0 text-right text-xs text-muted-foreground"
                      >
                        <div>{{ country.phoneCode }}</div>
                        <div>
                          {{ getCountryPrice(country.id) }}{{ currencyUnit }}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div class="space-y-2">
            <Label>{{ t("pages.receiveNumberPage.form.type") }}</Label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in messageTypeOptions"
                :key="option.value"
                type="button"
                class="rounded-full border px-3 py-2 text-sm transition-colors"
                :class="
                  form.msgType === option.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-zinc-200 bg-background text-foreground hover:bg-muted dark:border-zinc-800'
                "
                @click="handleTypeChange(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <Label>{{ t("pages.receiveNumberPage.form.mobile") }}</Label>
            <Input
              v-model="form.mobile"
              :placeholder="
                t('pages.receiveNumberPage.form.placeholders.mobile')
              "
            />
          </div>

          <Button
            class="h-12 flex items-center justify-center text-white font-medium  bg-[#42b883] hover:bg-[#42b883]/90 md:inline-flex cursor-pointer w-full duration-300"
            :disabled="submitLoading || globalLoading"
            @click="handleGetPhone"
          >
            {{
              submitLoading
                ? t("pages.receiveNumberPage.form.submitting")
                : t("pages.receiveNumberPage.form.submit")
            }}
          </Button>
        </CardContent>
      </Card>

      <Card class="min-w-0">
        <CardHeader>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{{
                t("pages.receiveNumberPage.currentPhone.title")
              }}</CardTitle>
              <CardDescription>{{
                t("pages.receiveNumberPage.currentPhone.description")
              }}</CardDescription>
            </div>
            <Badge
              v-if="currentPhone?.phone"
              variant="outline"
              :class="cn('whitespace-nowrap', statusBadgeClass('info'))"
            >
              {{ countdown }}s ·
              {{ t("pages.receiveNumberPage.currentPhone.polling") }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div
            v-if="!currentPhone?.phone"
            class="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-muted-foreground dark:border-zinc-800"
          >
            {{ t("pages.receiveNumberPage.currentPhone.empty") }}
          </div>

          <div v-else class="space-y-4">
            <div
              class="rounded-xl border border-zinc-200 bg-background p-4 dark:border-zinc-800"
            >
              <div class="text-sm text-muted-foreground">
                {{ t("pages.receiveNumberPage.currentPhone.phone") }}
              </div>
              <div class="mt-2 text-lg font-semibold break-all">
                +{{ currentPhone.countryTel }} {{ currentPhone.phone }}
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                v-for="item in currentPhoneCards"
                :key="item.key"
                class="rounded-xl border border-zinc-200 bg-background p-4 dark:border-zinc-800"
              >
                <div class="text-sm text-muted-foreground">
                  {{ item.label }}
                </div>
                <div class="mt-2 break-all text-sm font-medium">
                  {{ item.value }}
                </div>
              </div>
            </div>

            <div
              class="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-sm text-muted-foreground dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <div class="flex items-center justify-between gap-3">
                <span>{{
                  t("pages.receiveNumberPage.currentPhone.pollingTip")
                }}</span>
                <Badge
                  variant="destructive"
                  :class="
                    cn(
                      'whitespace-nowrap',
                      pollingLoading
                        ? statusBadgeClass('info')
                        : statusBadgeClass('success'),
                    )
                  "
                >
                  {{
                    pollingLoading
                      ? t("common.loading")
                      : t("pages.receiveNumberPage.currentPhone.ready")
                  }}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card class="min-w-0">
      <CardHeader>
        <CardTitle>{{ t("pages.receiveNumberPage.records.title") }}</CardTitle>
        <CardDescription>{{
          t("pages.receiveNumberPage.records.description")
        }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table
            class="w-full min-w-[980px] text-sm border-separate border-spacing-0"
          >
            <thead class="bg-zinc-50 dark:bg-zinc-900/60">
              <tr>
                <th class="px-4 py-3 text-left font-medium">
                  {{ t("pages.receiveNumberPage.records.columns.phone") }}
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  {{ t("pages.receiveNumberPage.records.columns.code") }}
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  {{ t("pages.receiveNumberPage.records.columns.smsContent") }}
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  {{ t("pages.receiveNumberPage.records.columns.createTime") }}
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  {{ t("pages.receiveNumberPage.records.columns.actions") }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!phoneRecords.length">
                <td
                  colspan="5"
                  class="px-4 py-10 text-center text-muted-foreground"
                >
                  {{ t("pages.receiveNumberPage.records.empty") }}
                </td>
              </tr>
              <tr
                v-for="row in phoneRecords"
                :key="`${row.pkey}-${row.createTime}`"
                class="border-b border-zinc-200 dark:border-zinc-800"
              >
                <td class="px-4 py-3 align-top">
                  <div class="space-y-1">
                    <Badge
                      variant="outline"
                      :class="cn('whitespace-nowrap', statusBadgeClass('info'))"
                    >
                      +{{ row.countryTel }} {{ row.phone }}
                    </Badge>
                    <div class="text-xs text-muted-foreground break-all">
                      PKEY: {{ row.pkey }}
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 align-top font-medium">
                  {{ row.codeNum || "-" }}
                </td>
                <td class="px-4 py-3 align-top">
                  <div class="max-w-[360px] break-words text-sm">
                    {{ row.smsContent || "-" }}
                  </div>
                </td>
                <td class="px-4 py-3 align-top whitespace-nowrap">
                  {{ row.createTime }}
                </td>
                <td class="px-4 py-3 align-top">
                  <div class="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      :disabled="recordActionLoading === `black-${row.pkey}`"
                      @click="handleRecordAction('black', row)"
                    >
                      {{ t("pages.receiveNumberPage.records.actions.black") }}
                    </Button>
                    <Button
                      size="sm"
                      :disabled="recordActionLoading === `release-${row.pkey}`"
                      @click="handleRecordAction('release', row)"
                    >
                      {{ t("pages.receiveNumberPage.records.actions.release") }}
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
