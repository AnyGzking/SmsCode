<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref, computed } from 'vue'
import * as z from 'zod'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from 'vue-i18n'
import { Lock } from 'lucide-vue-next'
import { useUserStore } from '@/store/modules/user'
import { storeToRefs } from 'pinia'
import { updatePasswordApi } from '@/api/auth'
import { ApiStatus } from '@/lib/status'

const { t } = useI18n()
const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const isLoaded = ref(true)
const isUpdatingPassword = ref(false)
const showPasswordSection = ref(false)

const userImageUrl = computed(() => userInfo.value?.avatar || '')
const displayUserName = computed(() => userInfo.value?.userName || userInfo.value?.realName || '-')
const displayEmail = computed(() => userInfo.value?.email || '-')
const displayUserAlt = computed(() => String(displayUserName.value || 'User'))

const passwordFormSchema = toTypedSchema(z.object({
  currentPassword: z
    .string()
    .min(6, {
      message: t('settings.profile.current_password_required'),
    }),
  newPassword: z
    .string()
    .min(8, {
      message: t('settings.profile.new_password_required'),
    }),
  confirmPassword: z
    .string()
    .min(8, {
      message: t('settings.profile.confirm_password_required'),
    }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t('settings.profile.password_not_match'),
  path: ['confirmPassword'],
}))

const {
  handleSubmit: handlePasswordSubmit,
  resetForm: resetPasswordForm,
  defineField: definePasswordField,
} = useForm({
  validationSchema: passwordFormSchema,
  initialValues: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
})

const [currentPassword, currentPasswordAttrs] = definePasswordField('currentPassword')
const [newPassword, newPasswordAttrs] = definePasswordField('newPassword')
const [confirmPassword, confirmPasswordAttrs] = definePasswordField('confirmPassword')

const onPasswordSubmit = handlePasswordSubmit(async (values) => {
  isUpdatingPassword.value = true

  try {
    const res = await updatePasswordApi({
      mode: 'modify',
      oldPassword: values.currentPassword,
      newPassword: values.newPassword,
      type: 'loginPwd',
    })

    if (res.code === ApiStatus.success) {
      toast({
        title: t('settings.profile.password_updated'),
        description: t('settings.profile.password_updated_description'),
      })

      resetPasswordForm()
      showPasswordSection.value = false
      return
    }

    toast({
      title: t('settings.profile.password_update_failed'),
      description: res.data.msg || t('settings.profile.password_update_failed'),
      variant: 'destructive',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : t('settings.profile.password_update_failed')
    toast({
      title: t('settings.profile.password_update_failed'),
      description: message,
      variant: 'destructive',
    })
  } finally {
    isUpdatingPassword.value = false
  }
})
</script>

<template>
  <div v-if="!isLoaded" class="flex items-center justify-center py-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
  </div>

  <div v-else class="w-full space-y-6">
    <div class="flex items-center gap-4">
      <div v-if="userImageUrl" class="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
        <img :src="userImageUrl" :alt="displayUserAlt" class="w-full h-full object-cover rounded-full" />
      </div>
      <div>
        <h3 class="text-lg font-medium">
          {{ t('settings.profile.title') }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ t('settings.profile.description') }}
        </p>
      </div>
    </div>

    <Separator />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      <Card class="w-full">
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">{{ t('settings.profile.personal_info') }}</CardTitle>
          <CardDescription class="text-xs">{{ t('settings.profile.personal_info_description') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <div class="text-sm font-medium">{{ t('settings.profile.username') }}</div>
            <Input :model-value="displayUserName" disabled readonly class="bg-muted cursor-not-allowed" />
          </div>

          <div class="space-y-2">
            <div class="text-sm font-medium">{{ t('settings.profile.email') }}</div>
            <Input :model-value="displayEmail" disabled readonly class="bg-muted cursor-not-allowed" />
          </div>
        </CardContent>
      </Card>

      <Card class="w-full">
        <CardHeader class="pb-3">
          <div class="flex items-center gap-2">
            <Lock class="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle class="text-lg">{{ t('settings.profile.password_section_title') }}</CardTitle>
              <CardDescription class="text-xs mt-1">{{ t('settings.profile.password_section_description') }}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="!showPasswordSection">
            <p class="text-sm text-muted-foreground mb-4">
              {{ t('settings.profile.password_prompt') }}
            </p>
            <Button
              variant="outline"
              size="sm"
              @click="showPasswordSection = true"
              class="w-full"
            >
              <Lock class="h-4 w-4 mr-2" />
              {{ t('settings.profile.change_password') }}
            </Button>
          </div>

          <form v-else class="space-y-4" @submit="onPasswordSubmit">
            <FormField name="currentPassword">
              <FormItem>
                <FormLabel>{{ t('settings.profile.current_password') }}</FormLabel>
                <FormControl>
                  <Input
                    v-model="currentPassword"
                    v-bind="currentPasswordAttrs"
                    type="password"
                    :placeholder="t('settings.profile.current_password_placeholder')"
                    autocomplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField name="newPassword">
              <FormItem>
                <FormLabel>{{ t('settings.profile.new_password') }}</FormLabel>
                <FormControl>
                  <Input
                    v-model="newPassword"
                    v-bind="newPasswordAttrs"
                    type="password"
                    :placeholder="t('settings.profile.new_password_placeholder')"
                    autocomplete="new-password"
                  />
                </FormControl>
                <FormDescription class="text-xs">
                  {{ t('settings.profile.new_password_helper_text') }}
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField name="confirmPassword">
              <FormItem>
                <FormLabel>{{ t('settings.profile.confirm_password') }}</FormLabel>
                <FormControl>
                  <Input
                    v-model="confirmPassword"
                    v-bind="confirmPasswordAttrs"
                    type="password"
                    :placeholder="t('settings.profile.confirm_password_placeholder')"
                    autocomplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="flex gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                :disabled="isUpdatingPassword"
                class="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <span v-if="isUpdatingPassword">{{ t('common.loading') }}</span>
                <span v-else>{{ t('settings.profile.update_password') }}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="() => { resetPasswordForm(); showPasswordSection = false }"
                :disabled="isUpdatingPassword"
              >
                {{ t('common.cancel') }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
