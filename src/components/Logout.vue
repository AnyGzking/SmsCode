<template>
  <AlertDialog>
    <AlertDialogTrigger as-child>
      <Button variant="ghost" size="icon" class="gap-2 w-full">
        <LogOut />
        {{ t('auth.logout.button') }}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('auth.logout.title') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('auth.logout.description') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction
          :disabled="loading"
          @click="handleSignOut"
          class="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <span>{{ loading ? t('auth.logout.loading') : t('auth.logout.confirm') }}</span>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <div v-if="error" class="fixed bottom-4 right-4">
    <Alert variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('common.error') || 'Error' }}</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from '@/components/ui/toast'
import { LogOut, Loader2, AlertCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { fetchLogout } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const loading = ref(false)
const error = ref<string | null>(null)

const handleSignOut = async () => {
  loading.value = true
  error.value = null

  try {
    await fetchLogout()
    userStore.clearAuth()
    toast({
      title: t('auth.sign_out_success'),
      description: t('auth.sign_out_success_description'),
    })
    router.push('/sign-in')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('auth.sign_out_failed')
    error.value = message
    console.error('Sign-out failed:', err)
    userStore.clearAuth()
    toast({
      title: t('auth.sign_out_failed'),
      description: message,
      variant: 'destructive',
    })
    router.push('/sign-in')
  } finally {
    loading.value = false
  }
}
</script>
