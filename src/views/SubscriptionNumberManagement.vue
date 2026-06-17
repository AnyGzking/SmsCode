<script setup lang="ts">
defineOptions({ name: 'SubscriptionNumberManagement' })

import SubscriptionNumberList from '@/components/subscription/SubscriptionNumberList.vue'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { useI18n } from 'vue-i18n'

// const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <!-- <Card>
      <CardHeader>
        <CardTitle>{{ t('pages.subscriptionNumberManagementPage.title') }}</CardTitle>
        <CardDescription>{{ t('pages.subscriptionNumberManagementPage.description') }}</CardDescription>
      </CardHeader>
    </Card> -->

    <SubscriptionNumberList />
  </div>
</template>
