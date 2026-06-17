<script setup lang="ts">
import { useSidebar } from '@/components/ui/sidebar/utils'
import { usePublicStore } from '@/store/modules/public'
const publicStore = usePublicStore()

const { state } = useSidebar()
</script>

<template>
  <div 
    class="flex items-center py-2" 
    :class="state === 'expanded' ? 'gap-2' : 'justify-center'"
  >
    <!-- 深色模式 Logo -->
    <img 
      :src="publicStore.getConfigItem('site', 'logoUrl')" 
      class="hidden dark:block" 
      width="45"
      height="25"
      alt="logo"
    />
    
    <!-- 浅色模式 Logo -->
    <img 
      :src="publicStore.getConfigItem('site', 'darkLogoUrl')" 
      class="block dark:hidden" 
      alt="logo"
      width="45"
      height="25"
    />

    <p 
      class="text-black dark:text-white font-semibold text-sm"
    >
      {{ state === 'expanded' ? publicStore.getConfigItem('site', 'enSiteName') : '' }}
    </p>
  </div>
</template>