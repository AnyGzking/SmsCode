<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserStore } from '@/store/modules/user'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarLogo,
} from '@/components/ui/sidebar';
import {
  BadgeCheck,
  BookOpen,
  ChevronsUpDown,
  CreditCard,
  PieChart,
  Settings2,
  SquareTerminal,
} from 'lucide-vue-next';
import Logout from '@/components/Logout.vue';
import { useI18n } from 'vue-i18n';
import NavItem from '@/components/NavItem.vue';
import { Switch } from '@/components/ui/switch';
import { useColorMode } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Moon, Sun } from 'lucide-vue-next';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import { storeToRefs } from 'pinia'

const { t } = useI18n();
const sidebarOpen = ref(true)
const route = useRoute()
const expandedMenus = ref<Record<string, boolean>>({})

const mode = useColorMode();
const isDark = computed({
  get: () => mode.value === 'dark',
  set: (value) => {
    mode.value = value ? 'dark' : 'light';
  },
});

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)
const keepAliveInclude = computed(() => [
  'Dashboard',
  'SettingsBalance',
  'SettingsOpenApi',
  'ReceiveNumber',
  'ReleaseNumber',
  'BlacklistNumber',
  'PackageOrders',
  'SubscribePlan',
  'SubscriptionNumberManagement',
  'MyOrders',
  'OrderDownload',
  'ExpenseStatistics',
])
const getRouteCacheKey = (currentRoute: { name?: unknown; fullPath: string; path: string }) => {
  return String(currentRoute.name || currentRoute.fullPath || currentRoute.path)
}
const displayName = computed(() => userInfo.value?.userName || userInfo.value?.realName || 'User')
const displayEmail = computed(() => userInfo.value?.email || 'user@example.com')
const displayAvatar = computed(() => userInfo.value?.avatar || '')
const displayBalance = computed(() => userInfo.value?.balance || '0')
const displayInitials = computed(() => {
  const text = displayName.value || 'U'
  return text.slice(0, 2).toUpperCase()
})

const data = {
  navMain: [
    {
      title: 'numberRental',
      url: '#',
      icon: SquareTerminal,
      isActive: false,
      items: [
        {
          title: 'receiveNumber',
          url: '/app/number-rental/receive-number',
        },
        {
          title: 'releaseNumber',
          url: '/app/number-rental/release-number',
        },
        {
          title: 'blacklistNumber',
          url: '/app/number-rental/blacklist-number',
        },
      ],
    },
    {
      title: 'packageSubscription',
      url: '#',
      icon: BadgeCheck,
      isActive: false,
      items: [
        {
          title: 'packageOrders',
          url: '/app/package-subscription/package-orders',
        },
        {
          title: 'subscribePlan',
          url: '/app/package-subscription/subscribe-plan',
        },
        {
          title: 'subscriptionNumberManagement',
          url: '/app/package-subscription/number-management',
        },
      ],
    },
    {
      title: 'orderManagement',
      url: '#',
      icon: CreditCard,
      isActive: false,
      items: [
        {
          title: 'myOrders',
          url: '/app/order-management/my-orders',
        },
        {
          title: 'orderDownload',
          url: '/app/order-management/order-download',
        },
        {
          title: 'expenseStatistics',
          url: '/app/order-management/expense-statistics',
        },
      ],
    },
    {
      title: 'settings',
      url: '#',
      icon: Settings2,
      isActive: true,
      items: [
        {
          title: 'profile',
          url: '/app/settings/profile',
        },
        {
          title: 'appearance',
          url: '/app/settings/appearance',
        },
        {
          title: 'balance',
          url: '/app/settings/balance',
        },
        {
          title: 'openapi',
          url: '/app/settings/openapi',
        }
      ],
    },
    {
      title: 'apiDoc',
      url: '/api',
      icon: BookOpen,
      isActive: false,
    },
  ],
};

const isMenuExpanded = (item: { title: string; items: Array<{ url: string }> }) => {
  if (expandedMenus.value[item.title] !== undefined) {
    return expandedMenus.value[item.title]
  }
  return item.items.some((subItem) => route.path.startsWith(subItem.url))
}

const handleMenuOpenChange = (title: string, open: boolean) => {
  expandedMenus.value = {
    ...expandedMenus.value,
    [title]: open,
  }
}

watch(
  () => route.path,
  () => {
    data.navMain.forEach((item) => {
      if (!item.items?.length) return
      const isActiveGroup = item.items.some((subItem) => route.path.startsWith(subItem.url))
      if (isActiveGroup) {
        expandedMenus.value = {
          ...expandedMenus.value,
          [item.title]: true,
        }
      }
    })
  },
  { immediate: true },
)
</script>

<template>
  <SidebarProvider v-model:open="sidebarOpen" :default-open="true">
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <router-link to="/">
            <SidebarLogo />
          </router-link>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <router-link to="/app/dashboard" :class="{ 'text-accent': $route.path === '/app/dashboard' }">
                <SidebarMenuButton :tooltip="t('navigation.dashboard')">
                  <PieChart />
                  <span>{{ t('navigation.dashboard') }}</span>
                </SidebarMenuButton>
              </router-link>
            </SidebarMenuItem>
            <!-- <SidebarMenuItem>
              <router-link to="/app/page-one" :class="{ 'text-accent': $route.path === '/app/page-one' }">
                <SidebarMenuButton :tooltip="t('pages.page_one')">
                  <SquareTerminal />
                  <span>{{ t('pages.page_one') }}</span>
                </SidebarMenuButton>
              </router-link>
            </SidebarMenuItem> -->
            <template v-for="item in data.navMain" :key="item.title">
              <Collapsible
                v-if="item.items?.length"
                as-child
                :open="isMenuExpanded(item)"
                @update:open="(open) => handleMenuOpenChange(item.title, open)"
                class="group/collapsible"
              >
                <SidebarMenuItem>
                  <NavItem :item="item" />
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                        <SidebarMenuSubButton as-child>
                          <router-link :to="subItem.url" :class="{
                            'text-accent': $route.path === subItem.url,
                          }">
                            <span>{{ t(`navigation.${subItem.title}`) }}</span>
                          </router-link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem v-else>
                <router-link :to="item.url" :class="{ 'text-accent': $route.path === item.url }">
                  <SidebarMenuButton :tooltip="t(`navigation.${item.title}`)">
                    <component :is="item.icon" />
                    <span>{{ t(`navigation.${item.title}`) }}</span>
                  </SidebarMenuButton>
                </router-link>
              </SidebarMenuItem>
            </template>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar class="h-8 w-8 rounded-lg">
                    <AvatarImage class="rounded-lg" :src="displayAvatar" :alt="displayAvatar || 'User Avatar'" />
                    <AvatarFallback class="rounded-lg">{{ displayInitials }}</AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{ displayName }}</span>
                    <span class="truncate text-xs">{{ displayEmail }}</span>
                  </div>
                  <ChevronsUpDown class="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom"
                align="end" :side-offset="4">
                <DropdownMenuLabel class="p-0 font-normal">
                  <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar class="h-8 w-8 rounded-lg">
                      <AvatarImage class="rounded-lg" :src="displayAvatar" :alt="displayAvatar || 'User Avatar'" />
                      <AvatarFallback class="rounded-lg">{{ displayInitials }}</AvatarFallback>
                    </Avatar>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-semibold">{{ displayName }}</span>
                      <span class="truncate text-xs">{{ displayEmail }}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <router-link to="/app/settings/profile" class="cursor-pointer">
                    <DropdownMenuItem class="cursor-pointer">
                      <BadgeCheck />
                      {{ t('settings.profile.title') }}
                    </DropdownMenuItem>
                  </router-link>
                  <router-link to="/app/settings/balance" class="cursor-pointer">
                    <DropdownMenuItem class="cursor-pointer">
                      <CreditCard />
                      {{ t('navigation.balance') }}
                    </DropdownMenuItem>
                  </router-link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <Logout />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <SidebarInset class="min-w-0 overflow-x-hidden">
      <header
        class="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
        </div>
        <div class="flex items-center gap-2 px-4">
          <router-link
            to="/app/settings/balance"
            class="hidden sm:flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-800"
          >
            <span class="text-muted-foreground">{{ t('pages.balancePage.summary.balance') }}</span>
            <span class="font-medium">{{ displayBalance }}</span>
          </router-link>
          <router-link
            to="/app/settings/balance"
            class="hidden sm:inline-flex text-sm font-medium text-primary hover:underline"
          >
            {{ t('pages.balancePage.recharge.title') }}
          </router-link>
          <Separator orientation="vertical" class="hidden sm:block h-4" />
          <LanguageSwitcher />
          <Separator orientation="vertical" class="h-4" />
          <Sun class="h-3.5 w-3.5 text-muted-foreground" />
          <Switch v-model:checked="isDark" class="scale-75" />
          <Moon class="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </header>
      <div
        class="relative flex flex-1 min-w-0 flex-col gap-4 p-4 pt-0 bg-[linear-gradient(6.6deg,rgba(192,132,252,0)_20.79%,rgba(95,251,23,0.1)_40.92%,rgba(204,171,238,0)_70.35%)]">
        <router-view v-slot="{ Component, route: currentRoute }">
          <keep-alive :include="keepAliveInclude">
            <component
              :is="Component"
              :key="getRouteCacheKey(currentRoute)"
            />
          </keep-alive>
        </router-view>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
