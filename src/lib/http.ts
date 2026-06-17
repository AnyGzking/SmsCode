import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from '@/components/ui/toast'; // 假设项目使用了这个吐司组件来显示错误信息
import { useUserStore } from '@/store/modules/user';
import router from '@/router';
import { ApiStatus } from '@/lib/status';
import { refreshTokenApi } from '@/api';
import { i18n } from '@/plugins/i18n';

// 解决循环依赖问题，后续会用到这个方法刷新 token
let isRefreshing = false;
let requests: any[] = [];


// 自定义请求配置，支持释放返回完整数据等选项
export interface CustomRequestConfig extends AxiosRequestConfig {
  returnRawResponse?: boolean; // 是否返回完整的 AxiosResponse，默认 false（只返回 data）
  showErrorMessage?: boolean; // 是否显示错误信息，默认 true
  showSuccessMessage?: boolean; // 是否显示成功信息，默认 false
}

export interface CustomInternalRequestConfig extends InternalAxiosRequestConfig {
  returnRawResponse?: boolean;
  showErrorMessage?: boolean;
  showSuccessMessage?: boolean;
  _retryCount?: number;
}

// 统一的接口响应格式（根据实际后端调整）
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg?: string;
}

function extractBusinessMessage(payload: any): string {
  if (!payload) return "";
  if (typeof payload === "string") return payload;

  const candidates = [
    payload.msg,
    payload.message,
    payload.errorMsg,
    payload.error_message,
    payload.data?.msg,
    payload.data?.message,
    payload.data?.errorMsg,
    payload.data?.error_message,
  ];

  const matched = candidates.find(
    (item) => typeof item === "string" && item.trim().length > 0,
  );

  return matched ? matched.trim() : "";
}

function createBusinessError(message: string, originalError?: unknown) {
  const businessError = new Error(message || "Error");
  (businessError as any).originalError = originalError;
  return businessError;
}

class HttpRequest {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: CustomInternalRequestConfig) => {
        // 自动携带 token
        const userStore = useUserStore();
        if (userStore.token) {
          config.headers['Authorization'] = userStore.token;
        }
        
        // 没传 Content-Type 就默认 json
        if (!config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }

        // 默认显示错误，默认不显示成功
        config.showErrorMessage = config.showErrorMessage ?? true;
        config.showSuccessMessage = config.showSuccessMessage ?? false;

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse, CustomInternalRequestConfig>) => {
        const { config } = response;
        const customConfig = config as CustomInternalRequestConfig;

        // 如果配置了返回完整响应，直接返回
        if (customConfig.returnRawResponse) {
          return response.data as any;
        }

        const res = response.data;

        // 成功响应处理
        if (res.code === ApiStatus.success) {
          if (customConfig.showSuccessMessage && res.msg) {
            toast({
              title: i18n.global.t('common.success'),
              description: res.msg,
            });
          }
          return res.data as any; // 返回 data
        }

        // 错误处理
        if (customConfig.showErrorMessage) {
          const message = extractBusinessMessage(res) || "系统异常";
          toast({
            title: i18n.global.t('http.failed'),
            description: message,
            variant: "destructive",
          });
        }
        return Promise.reject(
          createBusinessError(extractBusinessMessage(res) || "Error", res),
        );
      },
      async (error) => {
        const customConfig = error.config as CustomInternalRequestConfig;
        const { response } = error;
        const userStore = useUserStore();

        // 处理 401 刷新 token 的逻辑
        if (response && response.status === ApiStatus.unauthorized) {
          customConfig._retryCount = customConfig._retryCount || 0;

          if (customConfig._retryCount >= 3) {
            userStore.clearAuth();
            toast({
              title: i18n.global.t('http.login.authErr'),
              description: i18n.global.t("http.login.authTimeOut"),
              variant: "destructive",
            });
            router.push("/sign-in");
            return Promise.reject(error);
          }

          if (!isRefreshing) {
            isRefreshing = true;
            customConfig._retryCount += 1;

            try {
              const refreshRes = await refreshTokenApi({ refreshToken: userStore.refreshToken });
              
              const newAuth = refreshRes.data;
              userStore.setToken(newAuth.token, newAuth.refreshToken);
              
              // 重新执行被挂起的请求
              requests.forEach((cb) => cb(newAuth.token));
              requests = [];
              
              // 重新发送当前请求
              customConfig.headers['Authorization'] = newAuth.token;
              return this.instance(customConfig);
            } catch (err) {
              // 刷新失败，清空状态并跳转
              userStore.clearAuth();
              requests = [];
              toast({
                title: i18n.global.t('http.login.authErr'),
                description: i18n.global.t('http.login.authErrToken'),
                variant: "destructive",
              });
              router.push("/sign-in");
              return Promise.reject(err);
            } finally {
              isRefreshing = false;
            }
          } else {
            // 正在刷新，放入队列等待
            return new Promise((resolve) => {
              requests.push((token: string) => {
                customConfig.headers['Authorization'] = token;
                resolve(this.instance(customConfig));
              });
            });
          }
        }

        const businessMessage =
          extractBusinessMessage(response?.data) ||
          extractBusinessMessage(error) ||
          error.message ||
          i18n.global.t('http.network');

        if (customConfig?.showErrorMessage !== false) {
          toast({
            title: i18n.global.t('http.failed'),
            description: businessMessage,
            variant: "destructive",
          });
        }

        return Promise.reject(createBusinessError(businessMessage, error));
      },
    );
  }

  public request<T = any>(config: CustomRequestConfig): Promise<T> {
    return this.instance.request(config);
  }

  public get<T = any>(config: CustomRequestConfig): Promise<T> {
    return this.request({ ...config, method: "GET" });
  }

  public post<T = any>(config: CustomRequestConfig): Promise<T> {
    return this.request({ ...config, method: "POST" });
  }

  public put<T = any>(config: CustomRequestConfig): Promise<T> {
    return this.request({ ...config, method: "PUT" });
  }

  public delete<T = any>(config: CustomRequestConfig): Promise<T> {
    return this.request({ ...config, method: "DELETE" });
  }
}

export const http = new HttpRequest();
export default http;
