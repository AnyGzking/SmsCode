<script setup lang="ts">
import SettingsLayout from '@/components/settings/Layout.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { changeApiIsOpenApi, saveWhiteIpApi } from '@/api/auth'
import { ApiStatus } from '@/lib/status'
import { useUserStore } from '@/store/modules/user'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

const { t, tm } = useI18n()
const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const isEnabling = ref(false)
const isSavingWhiteIp = ref(false)
const whiteIp = ref('')

watch(
  () => userInfo.value?.whiteIp,
  (value) => {
    whiteIp.value = value ? String(value).split(',').join('\n') : ''
  },
  { immediate: true }
)

const guideItems = computed(() => tm('pages.openApiPage.guide.items') as string[])
const supportItems = computed(() => tm('pages.openApiPage.support.items') as string[])
const isOpenApi = computed(() => !!userInfo.value?.isOpenApi)
const appId = computed(() => String(userInfo.value?.userId || ''))
const apiKey = computed(() => userInfo.value?.apiKey || '')

const normalizedWhiteIp = computed(() => {
  return whiteIp.value
    .split(/\r?\n|,/) 
    .map(item => item.trim())
    .filter(Boolean)
    .join(',')
})

const handleEnableApi = async () => {
  isEnabling.value = true
  try {
    const res = await changeApiIsOpenApi({ isOpenApi: true })
    if (res.code == ApiStatus.success) {
      await userStore.refreshUserInfo()
      toast({
        title: t('pages.openApiPage.messages.openSuccess'),
        description: t('pages.openApiPage.messages.openSuccess'),
      })
      return
    }

    toast({
      title: t('common.error'),
      description: res.msg || t('common.error'),
      variant: 'destructive',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : t('common.error')
    toast({
      title: t('common.error'),
      description: message,
      variant: 'destructive',
    })
  } finally {
    isEnabling.value = false
  }
}

const handleSaveWhiteIp = async () => {
  isSavingWhiteIp.value = true
  try {
    const res = await saveWhiteIpApi({ whiteIp: normalizedWhiteIp.value })
    if (res.code === ApiStatus.success) {
      await userStore.refreshUserInfo()
      toast({
        title: t('pages.openApiPage.messages.saveSuccess'),
        description: t('pages.openApiPage.messages.saveSuccess'),
      })
      return
    }

    toast({
      title: t('common.error'),
      description: res.data.msg || t('common.error'),
      variant: 'destructive',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : t('common.error')
    toast({
      title: t('common.error'),
      description: message,
      variant: 'destructive',
    })
  } finally {
    isSavingWhiteIp.value = false
  }
}

const handleCopy = async (value: string) => {
  if (!value) return
  await navigator.clipboard.writeText(value)
  toast({
    title: t('pages.openApiPage.credentials.copy'),
    description: value,
  })
}
</script>

<template>
  <SettingsLayout>
    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{{ t('pages.openApiPage.title') }}</CardTitle>
          <CardDescription>{{ t('pages.openApiPage.description') }}</CardDescription>
        </CardHeader>
      </Card>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('pages.openApiPage.cards.status') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div>
                <div class="text-sm font-medium">{{ t('pages.openApiPage.cards.status') }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ isOpenApi ? t('pages.openApiPage.status.enabled') : t('pages.openApiPage.status.disabled') }}
                </div>
              </div>
              <Switch :checked="isOpenApi" disabled />
            </div>

            <p v-if="!isOpenApi" class="text-sm text-muted-foreground">
              {{ t('pages.openApiPage.status.hint') }}
            </p>

            <Button
              v-if="!isOpenApi"
              :disabled="isEnabling"
              @click="handleEnableApi"
              class="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {{ isEnabling ? t('pages.openApiPage.status.opening') : t('pages.openApiPage.status.openButton') }}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('pages.openApiPage.cards.credentials') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>{{ t('pages.openApiPage.credentials.appid') }}</Label>
              <div class="flex gap-2">
                <Input :model-value="appId || t('pages.openApiPage.credentials.empty')" readonly disabled class="bg-muted" />
                <Button type="button" variant="outline" @click="handleCopy(appId)">{{ t('pages.openApiPage.credentials.copy') }}</Button>
              </div>
            </div>
            <div class="space-y-2">
              <Label>{{ t('pages.openApiPage.credentials.apiKey') }}</Label>
              <div class="flex gap-2">
                <Input :model-value="apiKey || t('pages.openApiPage.credentials.empty')" readonly disabled class="bg-muted" />
                <Button type="button" variant="outline" @click="handleCopy(apiKey)">{{ t('pages.openApiPage.credentials.copy') }}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{{ t('pages.openApiPage.cards.whiteIp') }}</CardTitle>
          <CardDescription>{{ t('pages.openApiPage.whiteIp.helper') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>{{ t('pages.openApiPage.whiteIp.label') }}</Label>
            <Textarea v-model="whiteIp" :placeholder="t('pages.openApiPage.whiteIp.placeholder')" class="min-h-28" />
          </div>
          <Button
            :disabled="isSavingWhiteIp"
            @click="handleSaveWhiteIp"
            class="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {{ isSavingWhiteIp ? t('pages.openApiPage.whiteIp.saving') : t('pages.openApiPage.whiteIp.save') }}
          </Button>
        </CardContent>
      </Card>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('pages.openApiPage.cards.guide') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul class="space-y-3 text-sm text-muted-foreground list-disc pl-5">
              <li v-for="item in guideItems" :key="item">{{ item }}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('pages.openApiPage.cards.support') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul class="space-y-3 text-sm text-muted-foreground list-disc pl-5">
              <li v-for="item in supportItems" :key="item">{{ item }}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  </SettingsLayout>
</template>
