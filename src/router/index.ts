import { createRouter, createWebHashHistory } from "vue-router";
import { useUserStore } from '@/store/modules/user'
import { i18n } from '@/plugins/i18n'
import { usePublicStore } from '@/store/modules/public'
import { updateWebsiteMeta } from '@/lib/utils'

export const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/Home.vue"),
    meta: {
      requiresAuth: false,
      title: 'home.hero.title',
    },
  },
  {
    path: "/api",
    name: "Api",
    component: () => import("@/views/ApiDoc.vue"),
    meta: {
      requiresAuth: false,
      title: 'layouts.header.api',
    },
  },
  {
    path: "/blog",
    name: "blog",
    component: () => import("@/views/Blog.vue"),
    meta: {
      requiresAuth: false,
      title: 'pages.blog.hero.title',
    },
  },
  {
    path: "/help",
    name: "help",
    component: () => import("@/views/Help.vue"),
    meta: {
      requiresAuth: false,
      title: 'pages.help.hero.title',
    },
  },
  {
    path: "/about",
    name: "about",
    component: () => import("@/views/About.vue"),
    meta: {
      requiresAuth: false,
      title: 'pages.about.hero.title',
    },
  },
  {
    path: "/sign-up",
    name: "sign-up",
    component: () => import("@/views/SignUp.vue"),
    meta: {
      requiresAuth: false,
      title: 'auth.sign_up.title',
    },
  },
  {
    path: "/sign-in",
    name: "sign-in",
    component: () => import("@/views/SignIn.vue"),
    meta: {
      requiresAuth: false,
      title: 'auth.sign_in.title',
    },
  },
  {
    path: "/app",
    name: "app",
    component: () => import("@/layouts/AppLayout.vue"),
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("@/views/Dashboard.vue"),
        meta: {
          requiresAuth: true,
          title: 'navigation.dashboard',
          keepAlive: true,
        },
      },
      {
        path: "page-one",
        name: "page-one",
        component: () => import("@/views/PageOne.vue"),
        meta: {
          requiresAuth: true,
          title: 'pages.page_one',
        },
      },
      {
        path: "settings/profile",
        name: "profile",
        component: () => import("@/views/settings/Profile.vue"),
        meta: {
          requiresAuth: true,
          title: 'settings.profile.title',
        },
      },
      {
        path: "settings/appearance",
        name: "appearance",
        component: () => import("@/views/settings/Appearance.vue"),
        meta: {
          requiresAuth: true,
          title: 'settings.appearance.title',
        },
      },
      {
        path: "settings/balance",
        name: "settings-balance",
        component: () => import("@/views/settings/Balance.vue"),
        meta: {
          requiresAuth: true,
          title: 'pages.balancePage.title',
          keepAlive: true,
        },
      },
      {
        path: "settings/openapi",
        name: "settings-openapi",
        component: () => import("@/views/settings/OpenApi.vue"),
        meta: {
          requiresAuth: true,
          title: 'pages.openApiPage.title',
          keepAlive: true,
        },
      },
      {
        path: "number-rental/receive-number",
        name: "receive-number",
        component: () => import("@/views/ReceiveNumber.vue"),
        meta: {
          requiresAuth: true,
          title: 'navigation.receiveNumber',
          keepAlive: true,
        },
      },
      {
        path: "number-rental/release-number",
        name: "release-number",
        component: () => import("@/views/ReleaseNumber.vue"),
        meta: {
          requiresAuth: true,
          title: 'navigation.releaseNumber',
          keepAlive: true,
        },
      },
      {
        path: "number-rental/blacklist-number",
        name: "blacklist-number",
        component: () => import("@/views/BlacklistNumber.vue"),
        meta: {
          requiresAuth: true,
          title: 'navigation.blacklistNumber',
          keepAlive: true,
        },
      },
      {
        path: "package-subscription/package-orders",
        name: "package-orders",
        component: () => import("@/views/PackageOrders.vue"),
        meta: {
          requiresAuth: true,
          title: 'pages.packageOrdersPage.title',
          keepAlive: true,
        },
      },
      {
        path: "package-subscription/subscribe-plan",
        name: "subscribe-plan",
        component: () => import("@/views/SubscribePlan.vue"),
        meta: {
          requiresAuth: true,
          title: 'pages.subscribePlanPage.title',
          keepAlive: true,
        },
      },
      {
        path: "package-subscription/number-management",
        name: "subscription-number-management",
        component: () => import("@/views/SubscriptionNumberManagement.vue"),
        meta: {
          requiresAuth: true,
          title: 'pages.subscriptionNumberManagementPage.title',
          keepAlive: true,
        },
      },
      {
        path: "order-management/my-orders",
        name: "my-orders",
        component: () => import("@/views/MyOrders.vue"),
        meta: {
          requiresAuth: true,
          title: 'navigation.myOrders',
          keepAlive: true,
        },
      },
      {
        path: "order-management/order-download",
        name: "order-download",
        component: () => import("@/views/OrderDownload.vue"),
        meta: {
          requiresAuth: true,
          title: 'navigation.orderDownload',
          keepAlive: true,
        },
      },
      {
        path: "order-management/expense-statistics",
        name: "expense-statistics",
        component: () => import("@/views/ExpenseStatistics.vue"),
        meta: {
          requiresAuth: true,
          title: 'navigation.expenseStatistics',
          keepAlive: true,
        },
      },
      {
        path: "billing",
        name: "billing",
        component: () => import("@/views/Billing.vue"),
        meta: {
          requiresAuth: true,
          title: 'billing.title',
        },
      },
    ],
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: () => import("@/views/ResetPassword.vue"),
    meta: {
      requiresAuth: false,
      title: 'auth.reset_password.title',
    },
  },
  {
    path: "/dashboard",
    redirect: "/app/dashboard",
  },
  {
    path: "/404",
    name: "not-found",
    component: () => import("@/components/NotFound.vue"),
    meta: {
      requiresAuth: false,
      title: 'notFound.title',
    },
  },
  {
    path: "/:catchAll(.*)",
    redirect: { name: "not-found" },
    meta: {
      requiresAuth: false,
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLogin) {
    return { name: 'sign-in' }
  }

  return true
})

router.afterEach((to) => {
  const titleKey = to.meta.title as string | undefined
  if (!titleKey) return

  const publicStore = usePublicStore()
  const siteName = publicStore.getConfigItem('site', 'siteName', '')
  const title = i18n.global.t(titleKey)

  updateWebsiteMeta({
    title: siteName ? `${title} - ${siteName}` : title,
  })
})

export default router;
