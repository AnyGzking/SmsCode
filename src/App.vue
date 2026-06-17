<script setup lang="ts">
import { Toaster } from "@/components/ui/toast";
import { onMounted, ref } from "vue";
import { usePublicStore } from "@/store/modules/public";
import { useUserStore } from "@/store/modules/user";
import { fetchGetUserInfo } from "@/api/auth";
import { ApiStatus } from "@/lib/status";

const publicStore = usePublicStore();
const userStore = useUserStore();
const isAppReady = ref(false);

const applyTokenFromQuery = () => {
  if (typeof window === "undefined") return false;

  const url = new URL(window.location.href);
  const act = url.searchParams.get("act");
  const token = url.searchParams.get("token") || "";
  const refreshToken = url.searchParams.get("refreshToken") || "";

  if (act !== "admin_login" || !token || !refreshToken) return false;

  userStore.setToken(token, refreshToken);
  userStore.setIsLogin(true);
  return true;
};

const cleanAuthQuery = () => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.delete("act");
  url.searchParams.delete("token");
  url.searchParams.delete("refreshToken");
  const nextUrl = `${url.pathname}${url.search ? url.search : ""}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
};

onMounted(async () => {
  await publicStore.waitForConfigReady();

  const hasQueryToken = applyTokenFromQuery();
  if (hasQueryToken) {
    const userInfoRes = await fetchGetUserInfo();
    if (userInfoRes.code === ApiStatus.success) {
      userStore.setUserInfo(userInfoRes.data);
    } else {
      userStore.clearAuth();
    }
    cleanAuthQuery();
  }

  await userStore.waitForUserInfoReady();
  isAppReady.value = true;
});
</script>
<template>
  <Transition name="fade" mode="out-in">
    <div v-if="publicStore.isConfigLoaded && isAppReady">
      <router-view />
      <Toaster />
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
