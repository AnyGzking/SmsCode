<template>
  <div class="w-full h-full p-0 bg-transparent">
    <div class="art-card-sm p-5 flex flex-col sm:p-5 !bg-blue-50 mb-5">
      <span class="text-blue-800 text-lg font-bold">{{ t('menus.number.user-number.title') }}</span>
      <span class="text-blue-600 text-sm mt-3">{{ t('menus.number.user-number.desc') }}</span>
    </div>

    <ElRow v-loading="globalLoading">
      <ElCol :span="12">
        <div class="art-card-sm p-5 flex flex-col sm:p-5 !bg-gradient-to-r from-blue-50/30">
          <span class="text-base font-bold">{{ t('menus.number.user-number.card.title1') }}</span>
          <ElFormItem :label="t('menus.number.user-number.card.project')" class="mt-5">
            <ElSelect
              v-model="form.projectId"
              :placeholder="t('menus.number.user-number.placeholder.project')"
              clearable
              filterable
              :filter-method="filterProject"
              style="width: 100%"
              @change="handleProjectChange"
            >
              <ElOption
                v-for="item in projectList"
                :key="item.id"
                :label="item.name + '/' + item.code"
                :value="item.id"
                class="!h-auto !py-2"
              >
                <div class="flex items-center gap-3 w-full">
                  <!-- 项目图标 -->
                  <ElImage
                    v-if="item.icon"
                    :src="item.icon"
                    class="h-7 w-7 shrink-0 rounded-md bg-gray-50 dark:bg-gray-800"
                    fit="cover"
                  />
                  <ArtSvgIcon
                    v-else
                    icon="ri:image-line"
                    class="text-xl text-gray-400 dark:text-gray-500 shrink-0"
                  />

                  <!-- 项目名称和代码 -->
                  <div class="min-w-0 flex-1 flex flex-col justify-center leading-tight">
                    <div class="truncate font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      {{ item.name }}
                    </div>
                    <div class="truncate text-[11px] text-gray-400 mt-0.5">({{ item.code }})</div>
                  </div>

                  <!-- 价格和ID -->
                  <div class="flex flex-col items-end shrink-0 ml-2 leading-tight">
                    <span class="text-sm text-blue-600 dark:text-blue-400">{{ item.id }}</span>
                    <span class="text-[11px] text-gray-400 mt-0.5">
                      {{ t('menus.number.user-number.minPrice') }}{{ item.price }}
                    </span>
                  </div>
                </div>
              </ElOption>
            </ElSelect>
          </ElFormItem>

          <ElDivider />

          <ElFormItem :label="t('menus.number.user-number.card.country')">
            <ElSelect
              v-model="form.countryId"
              :placeholder="t('menus.number.user-number.placeholder.country')"
              clearable
              filterable
              :filter-method="filterCountry"
              style="width: 100%"
              :disabled="!channelConfig"
            >
              <ElOption
                v-for="item in countryList"
                :key="item.id"
                :label="item.name + '/' + item.code + '/' + item.phoneCode"
                :value="item.id"
              >
                <div class="flex items-center gap-2 w-full">
                  <ArtSvgIcon :icon="item.flag" />
                  <span>{{ item.name + '/' + item.code }}</span>
                  <span class="text-xs text-gray-500 ml-auto">{{ item.phoneCode }}</span>
                  <span
                    class="text-xs font-medium text-blue-600 ml-2 bg-blue-50 px-1.5 py-0.5 rounded"
                  >
                    {{ getCountryPrice(item.id) }}
                  </span>
                </div>
              </ElOption>
            </ElSelect>
          </ElFormItem>

          <ElFormItem :label="t('menus.number.user-number.card.type')" class="mt-5">
            <ElSelect
              v-model="form.msgType"
              :placeholder="t('menus.number.user-number.placeholder.type')"
              clearable
              multiple
              style="width: 100%"
              @change="handleTypeChange"
            >
              <ElOption label="全部类型" value="all" />
              <ElOption label="普通短信" value="sms" />
              <ElOption label="语音转短信" value="voice" />
              <ElOption label="来电号码转短信" value="incall" />
            </ElSelect>
          </ElFormItem>

          <ElFormItem :label="t('menus.number.user-number.card.mobile')" class="mt-5">
            <ElInput
              v-model="form.mobile"
              :placeholder="t('menus.number.user-number.placeholder.mobile')"
              clearable
              style="width: 100%"
            />
          </ElFormItem>

          <ElButton
            type="primary"
            class="mt-5 w-full"
            :loading="btnLoading"
            @click="handleGetPhone"
          >
            {{ t('menus.number.user-number.card.btn') }}
          </ElButton>
        </div>
      </ElCol>
      <ElCol :span="12" class="mb-5">
        <div
          class="art-card-sm p-5 flex flex-col sm:p-5 !bg-gradient-to-r from-blue-50/30 ml-[15px]"
        >
          <div class="flex justify-between items-center">
            <span class="text-base font-bold">{{ t('menus.number.user-number.card.title2') }}</span>
            <span v-if="currentPhone.phone" class="text-primary text-base font-medium"
              >{{ countdown }} 秒后重新获取短信内容</span
            >
          </div>
          <ElEmpty
            v-if="!currentPhone.phone"
            :description="t('menus.number.user-number.card.empty')"
          />
          <div class="space-y-5 mt-5" v-else>
            <div class="p-4 bg-white rounded-lg border border-slate-200">
              <div class="text-sm text-gray-500">{{
                t('menus.number.user-number.info.phone')
              }}</div>
              <div class="text-lg font-semibold text-gray-800"
                >+{{ currentPhone.countryTel }} {{ currentPhone.phone }}</div
              >
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 bg-white rounded-lg border border-slate-200">
                <div class="text-sm text-gray-500">{{
                  t('menus.number.user-number.info.country')
                }}</div>
                <div class="text-gray-800">{{ currentPhone.country }}</div>
              </div>
              <div class="p-4 bg-white rounded-lg border border-slate-200">
                <div class="text-sm text-gray-500">{{
                  t('menus.number.user-number.info.countryTel')
                }}</div>
                <div class="text-gray-800">+{{ currentPhone.countryTel }}</div>
              </div>
              <div class="p-4 bg-white rounded-lg border border-slate-200">
                <div class="text-sm text-gray-500">{{
                  t('menus.number.user-number.info.port')
                }}</div>
                <div class="text-gray-800 text-xs">{{ currentPhone.port }}</div>
              </div>
              <div class="p-4 bg-white rounded-lg border border-slate-200">
                <div class="text-sm text-gray-500">{{
                  t('menus.number.user-number.info.getTime')
                }}</div>
                <div class="text-gray-800 text-xs">{{ currentPhone.getTime }}</div>
              </div>
            </div>
            <div class="p-4 bg-white rounded-lg border border-slate-200">
              <div class="text-sm text-gray-500">{{
                t('menus.number.user-number.info.getCode')
              }}</div>
              <div class="text-gray-800 text-xs">{{ currentPhone.pkey }}</div>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <div class="art-card-sm p-5 flex flex-col sm:p-5 !bg-gradient-to-r from-blue-50/30 mt-5">
      <span class="text-base font-bold mb-4">{{ t('menus.number.user-number.card.title3') }}</span>
      <ElTable
        :data="phoneRecordList"
        stripe
        style="width: 100%"
        v-loading="tableLoading"
        :empty-text="t('menus.number.user-number.card.tableEmpty')"
      >
        <ElTableColumn prop="phone" label="号码" align="center" />
        <ElTableColumn prop="codeNum" label="验证码" align="center" />
        <ElTableColumn prop="smsContent" label="短信内容" align="center" show-overflow-tooltip />
        <ElTableColumn prop="createTime" label="获取时间" align="center" width="180" />
        <ElTableColumn label="操作" align="center" width="160">
          <template #default="scope">
            <ElButton type="danger" text size="small" @click="handleAddBlack(scope.row)">
              {{ t('menus.number.user-number.btn.black') }}
            </ElButton>
            <ElButton type="primary" text size="small" @click="handleSetRel(scope.row)">
              {{ t('menus.number.user-number.btn.rel') }}
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive, onUnmounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    getProjectListApi,
    getProjectChannelUseListApi,
    getAllCountryListApi,
    getPhoneApi,
    getPhoneCodeApi,
    addBlackApi,
    setRelApi
  } from '@/api/'
  import { useI18n } from 'vue-i18n'
  import { ApiStatus } from '@/utils/http/status'
  import { usePublicStore } from '@/store/modules/public'

  const publicStore = usePublicStore()
  const { t } = useI18n()

  const form = reactive({
    projectId: '',
    countryId: '' as string | number,
    msgType: ['all'] as string[],
    mobile: ''
  })

  const projectOriginList = ref<
    Array<{
      id: string | number
      name: string
      code: string
      price: number
      icon: string
    }>
  >([])
  const projectList = ref<typeof projectOriginList.value>([])
  const countryOriginList = ref<
    Array<{ id: string | number; name: string; code: string; flag: string; phoneCode: string }>
  >([])
  const countryList = ref<typeof countryOriginList.value>([])

  // 项目渠道详细配置
  const channelConfig = ref<{
    price: number
    supportType: number
    supportCountryIds: string[]
    countryPrices: Record<string, string>
    userPrices: Record<string, string>
    supplierId: string
    projectChannelId: string
  } | null>(null)

  const globalLoading = ref(false)
  const btnLoading = ref(false)
  const tableLoading = ref(false)
  const countdown = ref(10)
  let timer: number | null = null
  let isRequesting = ref(false)

  interface PhoneDataType {
    pkey: string
    getTime: string
    country: string
    countryTel: string
    dock: string
    phone: string
    port: string
    time: number
  }
  const currentPhone = ref<PhoneDataType>({} as PhoneDataType)

  interface PhoneRecordType extends PhoneDataType {
    codeNum: string
    smsContent: string
    createTime: string
  }
  const phoneRecordList = ref<PhoneRecordType[]>([])

  const filterProject = (searchVal: string) => {
    if (!searchVal) {
      projectList.value = [...projectOriginList.value]
      return
    }
    projectList.value = projectOriginList.value.filter(
      (item) =>
        item.name.toLowerCase().includes(searchVal.toLowerCase()) ||
        item.code.toLowerCase().includes(searchVal.toLowerCase())
    )
  }

  const filterCountry = (searchVal: string) => {
    // 基础列表取决于当前的 channelConfig 过滤后的结果
    let baseList: typeof countryOriginList.value = []
    if (!channelConfig.value) {
      baseList = []
    } else if (channelConfig.value.supportType === 1) {
      baseList = [...countryOriginList.value]
    } else {
      const ids = channelConfig.value.supportCountryIds.map(String)
      baseList = countryOriginList.value.filter((item) => ids.includes(String(item.id)))
    }

    if (!searchVal) {
      countryList.value = baseList
      return
    }
    countryList.value = baseList.filter(
      (item) =>
        item.name.toLowerCase().includes(searchVal.toLowerCase()) ||
        item.phoneCode.includes(searchVal) ||
        item.code.toLowerCase().includes(searchVal.toLowerCase())
    )
  }

  const handleTypeChange = (val: string[]) => {
    if (val.includes('all')) form.msgType = ['all']
  }

  // 监听项目变化，请求对应的国家渠道列表
  const handleProjectChange = async (val: string | number) => {
    form.countryId = '' // 清空已选国家
    channelConfig.value = null // 清空旧配置

    if (!val) return

    globalLoading.value = true
    try {
      const res = await getProjectChannelUseListApi({ projectId: val })
      if (res.code === ApiStatus.success) {
        channelConfig.value = res.data
        updateCountryList() // 更新国家下拉列表
      } else {
        ElMessage.error(res.msg || '获取项目配置失败')
      }
    } catch (err) {
      console.error('获取项目渠道列表失败:', err)
    } finally {
      globalLoading.value = false
    }
  }

  // 根据项目配置更新国家可选列表
  const updateCountryList = () => {
    if (!channelConfig.value) {
      countryList.value = []
      return
    }

    const { supportType, supportCountryIds } = channelConfig.value

    if (supportType === 1) {
      // 全部国家
      countryList.value = [...countryOriginList.value]
    } else {
      // 部分国家：仅保留 supportCountryIds 中的国家
      const ids = supportCountryIds.map(String)
      countryList.value = countryOriginList.value.filter((item) => ids.includes(String(item.id)))
    }
  }

  // 获取国家显示的最终价格：用户定价 > 国家定价 > 默认定价
  const getCountryPrice = (countryId: string | number) => {
    if (!channelConfig.value) return '0.00'

    const idStr = String(countryId)
    const { price, countryPrices, userPrices } = channelConfig.value

    // 用户独立定价优先
    if (userPrices && userPrices[idStr]) return userPrices[idStr]

    //  国家独立定价次之
    if (countryPrices && countryPrices[idStr]) return countryPrices[idStr]

    // 最后使用渠道默认价
    return Number(price).toFixed(2)
  }

  const handleGetPhone = async () => {
    if (!form.projectId) return ElMessage.warning(t('menus.number.user-number.tips.selectProject'))
    if (!form.countryId) return ElMessage.warning(t('menus.number.user-number.tips.selectCountry'))

    const selectCountry = countryOriginList.value.find((item) => item.id === form.countryId)
    if (!selectCountry) return ElMessage.error(t('menus.number.user-number.tips.getDataFail'))

    const requestParams = {
      supplierId: channelConfig.value?.supplierId,
      countryCode: selectCountry.code,
      price: getCountryPrice(form.countryId),
      projectChannelId: channelConfig.value?.projectChannelId,
      projectId: form.projectId,
      countryId: form.countryId,
      type: form.msgType,
      mobile: form.mobile.trim()
    }
    try {
      btnLoading.value = true
      const res = await getPhoneApi(requestParams)
      if (res.code === ApiStatus.success) {
        ElMessage.success(t('menus.number.user-number.tips.getPhoneSuccess'))
        currentPhone.value = res.data
        initTimer()
      } else {
        ElMessage.error(res.msg || t('menus.number.user-number.tips.getPhoneFail'))
      }
    } catch (err) {
      console.error(err)
    } finally {
      btnLoading.value = false
    }
  }

  const initTimer = () => {
    countdown.value = 10
    if (timer) clearInterval(timer)
    timer = setInterval(async () => {
      if (countdown.value > 0) {
        countdown.value--
      } else {
        countdown.value = 10
        if (!isRequesting.value) await autoGetCodeAction()
      }
    }, 1000) as unknown as number
  }

  // 定义需要静默过滤的错误文案（抽离常量，方便后续维护）
  const SILENT_ERROR_MSG = '等待验证码,5秒后重新调用'

  const autoGetCodeAction = async () => {
    if (!currentPhone.value.pkey || !form.projectId || !form.countryId) return
    const selectProject = projectOriginList.value.find((item) => item.id === form.projectId)
    const selectCountry = countryOriginList.value.find((item) => item.id === form.countryId)
    if (!selectProject || !selectCountry) return

    isRequesting.value = true
    const params = {
      ...currentPhone.value,
      projectId: form.projectId,
      countryId: form.countryId,
      supplierId: channelConfig.value?.supplierId,
      projectChannelId: channelConfig.value?.projectChannelId,
      countryCode: selectCountry.code,
      price: getCountryPrice(form.countryId),
      mobile: form.mobile.trim()
    }
    try {
      const res = await getPhoneCodeApi(params)
      if (res.code === ApiStatus.success) {
        const recordItem = {
          ...currentPhone.value,
          codeNum: res.data.codeNum,
          smsContent: res.data.smsContent,
          createTime: new Date().toLocaleString()
        }
        phoneRecordList.value.unshift(recordItem)
        if (timer) clearInterval(timer)
        countdown.value = 10
        ElMessage.success(t('menus.number.user-number.tips.getCodeSuccess') || '验证码获取成功！')
      } else {
        const errMsg = res.msg || t('menus.number.user-number.tips.getCodeFail')
        if (errMsg !== SILENT_ERROR_MSG) {
          ElMessage.error(errMsg)
        }
      }
    } catch (err: any) {
      const errMsg = err.msg || err.message || t('menus.number.user-number.tips.getCodeFail')
      if (errMsg !== SILENT_ERROR_MSG) {
        ElMessage.error(errMsg)
      }
      console.error('获取验证码异常：', err)
    } finally {
      isRequesting.value = false
    }
  }

  const handleAddBlack = async (row: PhoneRecordType) => {
    try {
      tableLoading.value = true
      const res = await addBlackApi({
        ...currentPhone.value,
        pkey: row.pkey,
        phone: row.phone,
        projectId: form.projectId
      })
      if (res.code === ApiStatus.success) {
        ElMessage.success(t('menus.number.user-number.tips.blackSuccess'))
        if (timer) clearInterval(timer)
        countdown.value = 10
        // currentPhone.value = {} as PhoneDataType
      } else {
        ElMessage.error(res.msg || t('menus.number.user-number.tips.blackFail'))
      }
    } catch (err) {
      console.error(err)
    } finally {
      tableLoading.value = false
    }
  }

  const handleSetRel = async (row: PhoneRecordType) => {
    try {
      tableLoading.value = true
      const res = await setRelApi({
        ...currentPhone.value,
        pkey: row.pkey,
        phone: row.phone,
        projectId: form.projectId
      })
      if (res.code === ApiStatus.success) {
        ElMessage.success(t('menus.number.user-number.tips.relSuccess'))
        phoneRecordList.value = phoneRecordList.value.filter((item) => item.pkey !== row.pkey)
        if (timer) clearInterval(timer)
        countdown.value = 10
        // currentPhone.value = {} as PhoneDataType
      } else {
        ElMessage.error(res.msg || t('menus.number.user-number.tips.relFail'))
      }
    } catch (err) {
      console.error(err)
    } finally {
      tableLoading.value = false
    }
  }

  const initData = async () => {
    try {
      globalLoading.value = true
      const [projectRes, countryRes] = await Promise.all([
        getProjectListApi(),
        getAllCountryListApi()
      ])
      if (projectRes.code === ApiStatus.success) {
        projectOriginList.value = projectRes.data
        projectList.value = projectRes.data
      }
      if (countryRes.code === ApiStatus.success) {
        countryOriginList.value = countryRes.data
        countryList.value = countryRes.data
      }
    } catch (err) {
      console.error(err)
    } finally {
      globalLoading.value = false
    }
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  initData()
</script>

<style lang="scss" scoped></style>
