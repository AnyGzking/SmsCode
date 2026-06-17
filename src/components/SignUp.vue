<template>
  <section
    class="container relative flex min-h-[100dvh] items-start justify-center bg-white px-4 pt-[10rem] dark:bg-black"
  >
    <div
      class="absolute inset-0 h-[580px] blur-xl"
      :style="{
        background:
          'linear-gradient(143.6deg, rgba(66, 184, 131, 0) 20.79%, rgba(66, 184, 131, 0.26) 40.92%, rgba(66, 184, 131, 0) 70.35%)',
      }"
    ></div>
    <div v-if="!isLoaded" class="z-10">
      <div class="flex items-center justify-center">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        ></div>
      </div>
    </div>

    <div
      v-else
      class="mx-auto z-10 w-full max-w-[500px] rounded-lg border border-gray-200 px-2 py-4 text-gray-700 backdrop-blur md:px-4 dark:border-white/10"
    >
      <div
        v-if="error"
        class="mb-4 rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-200 dark:text-red-800"
        role="alert"
      >
        {{ error }}
      </div>

      <div class="mx-auto max-w-2xl text-gray-700 md:text-center dark:text-white">
        <h2 class="text-3xl tracking-tighter">
          {{ t('auth.sign_up.title') }}
        </h2>
        <p class="mt-4 text-lg tracking-tight text-gray-700 dark:text-gray-300">
          {{ t('auth.sign_up.description') }}
        </p>
      </div>

      <form class="mt-6" @submit.prevent="handleSignUp">
        <div class="mb-2">
          <label
            for="userName"
            class="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >{{ t('auth.sign_up.username_label') }}</label>
          <Input
            id="userName"
            v-model="userName"
            :placeholder="t('auth.sign_up.username_placeholder')"
            required
            type="text"
            :disabled="loading"
            class="mt-1 block w-full rounded-md border-gray-300 text-gray-700 shadow-sm focus:border-neutral-800 focus:ring-neutral-800 dark:text-white"
          />
        </div>
        <div class="mb-2">
          <label
            for="email"
            class="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >{{ t('auth.sign_up.email_label') }}</label>
          <Input
            id="email"
            v-model="email"
            placeholder="m@example.com"
            required
            type="email"
            :disabled="loading"
            class="mt-1 block w-full rounded-md border-gray-300 text-gray-700 shadow-sm focus:border-neutral-800 focus:ring-neutral-800 dark:text-white"
          />
        </div>
        <div class="mb-5">
          <label
            for="password"
            class="block text-sm font-medium text-gray-900 dark:text-white"
          >{{ t('auth.sign_up.password_label') }}</label>
          <Input
            id="password"
            v-model="password"
            :placeholder="t('auth.sign_up.password_placeholder')"
            required
            type="password"
            :disabled="loading"
            class="mt-1 block w-full rounded-md border-gray-300 text-gray-700 shadow-sm focus:border-neutral-800 focus:ring-neutral-800 dark:text-white"
          />
        </div>

        <div class="mb-5">
          <Captcha ref="captchaRef" @change="handleCaptchaChange" />
        </div>

        <button
          :disabled="loading"
          class="flex w-full cursor-pointer items-center justify-center gap-x-1 rounded-full bg-[#42b883] px-4 py-3 font-medium text-white transition-all duration-300 hover:bg-[#42b883]/90 disabled:opacity-50 md:inline-flex"
        >
          <span
            v-if="loading"
            class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
          ></span>
          <span class="relative">{{
            loading
              ? t('auth.sign_up.signing_up')
              : t('auth.sign_up.sign_up_button')
          }}</span>
        </button>
      </form>

      <div class="mt-6 flex items-center justify-between text-center text-sm">
        <router-link
          class="ml-2 font-medium text-gray-900 underline-offset-4 hover:underline dark:text-gray-500"
          to="/sign-in"
        >
          {{ t('auth.sign_up.have_account') }}
        </router-link>

        <router-link
          class="text-gray-500 dark:text-gray-400"
          to="/reset-password"
        >
          {{ t('auth.sign_in.forgot_password') }}
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from '@/components/ui/toast'
import Input from '@/components/ui/input/Input.vue'
import Captcha from '@/components/Captcha.vue'
import { accountResignApi } from '@/api/auth'
import { ApiStatus } from '@/lib/status'

const router = useRouter()
const { t } = useI18n()

const userName = ref('')
const email = ref('')
const password = ref('')
const captcha = ref('')
const captchaKey = ref('')
const captchaRef = ref<InstanceType<typeof Captcha> | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const isLoaded = ref(true)

const handleCaptchaChange = (data: { captcha: string; captchaKey: string }) => {
  captcha.value = data.captcha
  captchaKey.value = data.captchaKey
}

const handleSignUp = async () => {
  error.value = null

  const captchaValid = captchaRef.value?.validate() ?? false
  if (!captchaValid) {
    error.value = t('auth.captcha.required')
    return
  }

  loading.value = true

  try {
    const res = await accountResignApi({
      userName: userName.value,
      email: email.value,
      password: password.value,
      confirmPassword: password.value,
      captchaCode: captcha.value,
      captchaKey: captchaKey.value,
    })

    if (res.code === ApiStatus.success) {
      toast({
        title: t('auth.sign_up_success'),
        description: t('auth.sign_up_success_description'),
      })
      router.push('/sign-in')
      return
    }

    error.value = res.msg || t('auth.sign_up_failed')
    toast({
      title: t('auth.sign_up_failed'),
      description: error.value || t('auth.sign_up_failed'),
      variant: 'destructive',
    })
    await captchaRef.value?.refreshCaptcha()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('auth.sign_up_failed')
    error.value = message
    console.error('Sign-up failed:', err)
    toast({
      title: t('auth.sign_up_failed'),
      description: message,
      variant: 'destructive',
    })
    await captchaRef.value?.refreshCaptcha()
  } finally {
    loading.value = false
  }
}
</script>
