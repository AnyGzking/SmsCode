<template>
  <div class="w-full">
    <div class="flex items-start gap-3 w-full">
      <div class="flex-1">
        <label
          for="captcha"
          class="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >{{ t("auth.captcha.label") }}</label
        >
        <Input
          id="captcha"
          v-model="captcha"
          :placeholder="t('auth.captcha.placeholder')"
          :disabled="loading"
          class="mt-1 block w-full rounded-md text-gray-700 dark:text-white border-gray-300 shadow-sm focus:border-neutral-800 focus:ring-neutral-800"
          @input="emitCaptchaChange"
          @keydown.enter.prevent
        />
        <p v-if="showError" class="mt-2 text-sm text-red-500">
          {{ t("auth.captcha.required") }}
        </p>
      </div>

      <button
        type="button"
        class="mt-6 h-10 w-[120px] shrink-0 overflow-hidden rounded-md border border-gray-300 bg-zinc-50 dark:bg-zinc-900 dark:border-white/10 flex items-center justify-center transition-opacity"
        :class="
          loading
            ? 'cursor-not-allowed opacity-70'
            : 'cursor-pointer hover:opacity-90'
        "
        :disabled="loading"
        @click="refreshCaptcha"
      >
        <span
          v-if="loading"
          class="h-5 w-5 animate-spin rounded-full border-2 border-[#42b883] border-t-transparent"
        ></span>
        <img
          v-else-if="captchaSrc"
          :src="captchaSrc"
          :alt="t('auth.captcha.image_alt')"
          class="h-full w-full object-cover"
        />
        <span v-else class="text-xs text-muted-foreground px-2 text-center">
          {{ t("auth.captcha.loading") }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import Input from "@/components/ui/input/Input.vue";
import { getCaptcha } from "@/api/public";

const { t } = useI18n();

const emit = defineEmits<{
  (e: "change", data: { captcha: string; captchaKey: string }): void;
  (e: "refresh", status: boolean): void;
}>();

const captcha = ref("");
const captchaKey = ref("");
const captchaSrc = ref("");
const loading = ref(false);
const showError = ref(false);

const emitCaptchaChange = () => {
  showError.value = false;
  emit("change", {
    captcha: captcha.value,
    captchaKey: captchaKey.value,
  });
};

const loadCaptcha = async (force = false) => {
  if (loading.value && !force) return false;

  loading.value = true;
  showError.value = false;

  try {
    const res = await getCaptcha();
    captchaSrc.value = res.image;
    captchaKey.value = res.key;
    emit("change", {
      captcha: captcha.value,
      captchaKey: captchaKey.value,
    });
    emit("refresh", true);
    return true;
  } catch (error) {
    captchaSrc.value = "";
    captchaKey.value = "";
    emit("refresh", false);
    return false;
  } finally {
    loading.value = false;
  }
};

const refreshCaptcha = async () => {
  captcha.value = "";
  await loadCaptcha(true);
};

const validate = () => {
  showError.value = !captcha.value.trim();
  return !showError.value && !!captchaKey.value;
};

const clearCaptchaInput = () => {
  captcha.value = "";
  showError.value = false;
};

onMounted(() => {
  loadCaptcha();
});

defineExpose({
  validate,
  refreshCaptcha,
  clearCaptchaInput,
});
</script>
