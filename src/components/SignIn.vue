<template>
  <section
    class="container flex min-h-[100dvh] relative items-start pt-[10rem] justify-center bg-white px-4 dark:bg-black"
  >
    <div
      class="absolute inset-0 blur-xl h-[580px]"
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
      class="mx-auto z-10 text-gray-700 w-full max-w-[500px] backdrop-blur bg-transparent border border-gray-200 dark:border-white/10 px-2 md:px-4 py-4 rounded-lg"
    >
      <div
        v-if="error"
        class="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
        role="alert"
      >
        {{ error }}
      </div>

      <div
        class="mx-auto max-w-2xl md:text-center text-gray-700 dark:text-white"
      >
        <h2 class="text-3xl tracking-tighter">
          {{ t('auth.sign_in.title') }}
        </h2>
        <p class="mt-4 text-lg tracking-tight text-gray-700 dark:text-gray-300">
          {{ t('auth.sign_in.description') }}
        </p>
      </div>

      <form class="mt-6" @submit.prevent="handleSignIn">
        <div class="mb-2">
          <label
            for="account"
            class="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >{{ t('auth.sign_in.account_label') }}</label>
          <Input
            id="account"
            v-model="account"
            :placeholder="t('auth.sign_in.account_placeholder')"
            required
            type="text"
            :disabled="loading"
            class="mt-1 block w-full rounded-md text-gray-700 dark:text-white border-gray-300 shadow-sm focus:border-neutral-800 focus:ring-neutral-800"
          />
        </div>
        <div class="mb-5">
          <label
            for="password"
            class="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >{{ t('auth.sign_in.password_label') }}</label>
          <Input
            id="password"
            v-model="password"
            :placeholder="t('auth.sign_in.password_placeholder')"
            required
            type="password"
            :disabled="loading"
            class="mt-1 block w-full rounded-md text-gray-700 dark:text-white border-gray-300 shadow-sm focus:border-neutral-800 focus:ring-neutral-800"
          />
        </div>
        <div class="mb-5">
          <Captcha ref="captchaRef" @change="handleCaptchaChange" />
        </div>
        <label class="mb-5 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            v-model="rememberPassword"
            type="checkbox"
            :disabled="loading"
            class="h-4 w-4 rounded border-gray-300 text-[#42b883] focus:ring-[#42b883]"
          />
          <span>{{ t('auth.sign_in.remember_password') }}</span>
        </label>

        <button
          :disabled="loading"
          class="flex items-center justify-center py-3 px-4 mt-5 text-white font-medium transform-gpu bg-[#42b883] hover:bg-[#42b883]/90 rounded-full md:inline-flex cursor-pointer w-full disabled:opacity-50 transition-all duration-300"
        >
          <span
            v-if="loading"
            class="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white"
          ></span>
          <span class="relative">{{
            loading
              ? t('auth.sign_in.signing_in')
              : t('auth.sign_in.sign_in_button')
          }}</span>
        </button>
      </form>

      <div class="flex items-center mt-6 text-center text-sm justify-between">
        <router-link
          class="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-gray-500 ml-2"
          to="/sign-up"
        >
          {{ t('auth.sign_in.no_account') }}
        </router-link>
        <router-link class="mt-4 text-gray-500 dark:text-gray-400" to="/reset-password">
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
import { accountLogin, fetchGetUserInfo } from '@/api/auth'
import { ApiStatus } from '@/lib/status'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const REMEMBER_PASSWORD_KEY = 'signInRememberPassword'

const getRememberedPassword = () => {
  try {
    return JSON.parse(localStorage.getItem(REMEMBER_PASSWORD_KEY) || 'null') as {
      account?: string
      password?: string
    } | null
  } catch {
    return null
  }
}

const saveRememberedPassword = () => {
  if (!rememberPassword.value) {
    localStorage.removeItem(REMEMBER_PASSWORD_KEY)
    return
  }

  localStorage.setItem(
    REMEMBER_PASSWORD_KEY,
    JSON.stringify({
      account: account.value,
      password: password.value,
    }),
  )
}

const rememberedPassword = getRememberedPassword()
const account = ref(rememberedPassword?.account || '')
const password = ref(rememberedPassword?.password || '')
const rememberPassword = ref(Boolean(rememberedPassword))
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

const handleSignIn = async () => {
  error.value = null

  const captchaValid = captchaRef.value?.validate() ?? false
  if (!captchaValid) {
    error.value = t('auth.captcha.required')
    return
  }

  loading.value = true

  try {
    const params: Api.Auth.LoginParams = {
      passWord: password.value,
      captcha: captcha.value,
      captchaKey: captchaKey.value,
    }

    if (account.value.includes('@')) {
      params.email = account.value
    } else {
      params.userName = account.value
    }

    const res = await accountLogin(params)

    if (res.code === ApiStatus.success) {
      saveRememberedPassword()
      userStore.setToken(res.data.token, res.data.refreshToken)
      userStore.setIsLogin(true)

      const userInfoRes = await fetchGetUserInfo()
      if (userInfoRes.code === ApiStatus.success) {
        userStore.setUserInfo(userInfoRes.data)
      }

      toast({
        title: t('auth.sign_in_success'),
        description: t('auth.sign_in_success_description'),
      })
      router.push('/app/dashboard')
      return
    }

    error.value = res.msg || t('auth.sign_in_failed')
    toast({
      title: t('auth.sign_in_failed'),
      description: error.value || t('auth.sign_in_failed'),
      variant: 'destructive',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('auth.sign_in_failed')
    error.value = message
    console.error('Sign-in failed:', err)
    toast({
      title: t('auth.sign_in_failed'),
      description: message,
      variant: 'destructive',
    })
    await captchaRef.value?.refreshCaptcha()
  } finally {
    loading.value = false
  }
}
</script>
