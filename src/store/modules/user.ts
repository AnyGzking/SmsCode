import { defineStore } from 'pinia';
import { fetchGetUserInfo } from '@/api/auth'
import { ApiStatus } from '@/lib/status'

interface UserState {
  token: string;
  refreshToken: string;
  userInfo: Api.Auth.UserInfo | null;
  isLogin: boolean;
  isLoadingUserInfo: boolean;
  isUserInfoLoaded: boolean;
}

const getStoredUserInfo = (): Api.Auth.UserInfo | null => {
  const raw = localStorage.getItem('userInfo')
  if (!raw) return null

  try {
    return JSON.parse(raw) as Api.Auth.UserInfo
  } catch {
    localStorage.removeItem('userInfo')
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    userInfo: getStoredUserInfo(),
    isLogin: localStorage.getItem('isLogin') === 'true',
    isLoadingUserInfo: false,
    isUserInfoLoaded: false,
  }),
  actions: {
    setToken(token: string, refreshToken: string) {
      this.token = token;
      this.refreshToken = refreshToken;
      this.isLogin = true;
      localStorage.setItem('isLogin', 'true');
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
    },
    setIsLogin(value: boolean) {
      this.isLogin = value;
      if (value) {
        localStorage.setItem('isLogin', 'true');
      } else {
        localStorage.removeItem('isLogin');
      }
    },
    setUserInfo(userInfo: Api.Auth.UserInfo) {
      this.userInfo = userInfo;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      this.isUserInfoLoaded = true;
    },
    async refreshUserInfo() {
      if (this.isLoadingUserInfo) return this.userInfo;

      this.isLoadingUserInfo = true;
      try {
        const res = await fetchGetUserInfo()
        if (res.code === ApiStatus.success) {
          this.setUserInfo(res.data)
          return res.data
        }
        return null
      } finally {
        this.isLoadingUserInfo = false;
      }
    },
    async waitForUserInfoReady() {
      if (!this.isLogin || !this.token) {
        this.isUserInfoLoaded = true;
        return true;
      }

      if (this.isLoadingUserInfo) {
        return new Promise((resolve) => {
          const timer = setInterval(() => {
            if (!this.isLoadingUserInfo) {
              clearInterval(timer);
              resolve(true);
            }
          }, 100);
        });
      }

      await this.refreshUserInfo();
      this.isUserInfoLoaded = true;
      return true;
    },
    clearAuth() {
      this.token = '';
      this.refreshToken = '';
      this.userInfo = null;
      this.isLogin = false;
      this.isLoadingUserInfo = false;
      this.isUserInfoLoaded = false;
      localStorage.removeItem('isLogin');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
    },
  },
});
