import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getConfigApi } from '@/api/public';
import { ApiStatus } from '@/lib/status';
import { updateWebsiteFavicon, updateWebsiteMeta } from '@/lib/utils';

export interface AgreementItem {
  key: string;
  name: string;
  value: string;
}

interface ConfigData {
  [group: string]: {
    [key: string]: any;
  } & {
    agreements?: AgreementItem[];
  };
}

interface ParsedContactItem {
  value?: string;
  href?: string;
}

interface ParsedContactConfig {
  telegram?: ParsedContactItem;
  github?: ParsedContactItem;
  whatsapp?: ParsedContactItem;
  [key: string]: ParsedContactItem | undefined;
}

const parseContactString = (rawContact: unknown): ParsedContactConfig => {
  if (!rawContact || typeof rawContact !== 'string') {
    return {};
  }

  try {
    let normalized = rawContact.trim();

    normalized = normalized.replace(/\r/g, '');
    normalized = normalized.replace(/\n/g, '\n');
    normalized = normalized.replace(/\"/g, '"');
    normalized = normalized.replace(/`/g, '');
    normalized = normalized.trim();

    const clean = (value?: string) => value?.replace(/`/g, '').trim();

    const pick = (field: string) => {
      const match = normalized.match(new RegExp(`"${field}"\s*:\s*"([\s\S]*?)"(?:,|$)`));
      return clean(match?.[1]);
    };

    return {
      telegram: {
        value: pick('telegram'),
        href: pick('telegramHref'),
      },
      github: {
        value: pick('github'),
        href: pick('githubHref'),
      },
      whatsapp: {
        value: pick('whatsapp'),
        href: pick('whatsappHref'),
      },
    };
  } catch (error) {
    console.error('解析 contact 配置失败:', error, rawContact);
    return {};
  }
};

const applyWebsiteConfig = (configData: ConfigData) => {
  const site = configData.site || {};

  updateWebsiteFavicon(site.userLogo || site.darkLogoUrl || site.logoUrl);
  updateWebsiteMeta({
    title: site.enSiteName + '-' + site.loginText,
    keywords: site.loginText || site.siteName,
    description: site.loginFuText || site.siteDescription || site.siteName,
  });
};

export const usePublicStore = defineStore('publicStore', () => {
  const config = ref<ConfigData>({});
  const isLoading = ref(false);
  const isConfigLoaded = ref(false);

  const getConfigByGroup = computed(() => (group: string) => {
    return config.value[group] || {};
  });

  const getConfigItem = computed(
    () =>
      (group: string, key: string | number, defaultValue: any = null) => {
        return config.value[group]?.[key] ?? defaultValue;
      }
  );

  const parsedContact = computed(() => {
    const siteContact = config.value.site?.contact;
    return parseContactString(siteContact);
  });

  const fetchConfig = async (isRefresh = false) => {
    try {
      isLoading.value = true;
      const response = await getConfigApi();
      if (response.code == ApiStatus.success) {
        config.value = response.data as ConfigData;
        applyWebsiteConfig(config.value);
        isConfigLoaded.value = true;
        if (isRefresh) {
          console.log('配置刷新成功');
        }
      }
      return true;
    } catch (error) {
      console.error(isRefresh ? '刷新配置失败:' : '加载配置失败:', error);
      if (!isRefresh) {
        isConfigLoaded.value = false;
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const loadConfig = async () => {
    if (isLoading.value) return false;
    if (isConfigLoaded.value) return true;

    return await fetchConfig(false);
  };

  const refreshConfig = async () => {
    if (isLoading.value) return false;
    return await fetchConfig(true);
  };

  const waitForConfigReady = async () => {
    if (isConfigLoaded.value) return true;
    if (isLoading.value) {
      return new Promise((resolve) => {
        const timer = setInterval(() => {
          if (!isLoading.value) {
            clearInterval(timer);
            resolve(isConfigLoaded.value);
          }
        }, 100);
      });
    }
    await loadConfig();
    return isConfigLoaded.value;
  };

  const resetConfig = () => {
    config.value = {};
    isConfigLoaded.value = false;
  };

  return {
    config,
    isLoading,
    isConfigLoaded,
    getConfigByGroup,
    getConfigItem,
    parsedContact,
    loadConfig,
    refreshConfig,
    waitForConfigReady,
    resetConfig,
  };
});
