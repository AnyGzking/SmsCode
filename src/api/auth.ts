import { http } from '@/lib/http';

export function fetchGetUserInfo() {
  return http.get<Api.Auth.UserInfoResponse>({
    url: '/admin/auth/userInfo',
    showErrorMessage: true,
    returnRawResponse: true
  });
}

export function refreshTokenApi(params: Api.Auth.RefreshTokenParams) {
  return http.post<Api.BaseResponse>({
    url: '/admin/auth/refreshToken',
    data: params,
    returnRawResponse: true
  });
}

export function accountLogin(params: Api.Auth.LoginParams) {
  return http.post<Api.Auth.LoginResponse>({
    url: '/admin/auth/accountLogin',
    data: params,
    returnRawResponse: true
  });
}

export function fetchLogout() {
  return http.post<Api.BaseResponse>({
    url: '/admin/auth/logout',
    returnRawResponse: true
  })
}

export function updatePasswordApi(params: any) {
  return http.post<Api.BaseResponse>({
    url: '/admin/auth/updatePassword',
    data: params,
    returnRawResponse: true
  })
}

export function saveWhiteIpApi(params: any) {
  return http.post<Api.BaseResponse>({
    url: '/admin/auth/saveWhiteIp',
    data: params,
    returnRawResponse: true
  })
}

export function saveCallbackApi(params: any) {
  return http.post<Api.BaseResponse>({
    url: '/admin/auth/saveCallback',
    data: params,
    returnRawResponse: true
  })
}

export function changeApiIsOpenApi(params: any) {
  return http.post<any>({
    url: '/admin/auth/changeApiIsOpen',
    data: params,
    returnRawResponse: true
  })
}

export function balanceChangeListApi(params: any) {
  return http.post<any>({
    url: '/admin/auth/balanceChangeList',
    data: params,
    returnRawResponse: true
  })
}

export function createPayOrderApi(params: any) {
  return http.post<any>({
    url: '/admin/pay/createOrder',
    data: params,
    returnRawResponse: true
  })
}

export function getOrderPayStatusApi(params: any) {
  return http.post<any>({
    url: '/admin/pay/getOrderPayStatus',
    data: params,
    returnRawResponse: true
  })
}

export function getUserComboListApi(params: any) {
  return http.post<any>({
    url: '/admin/combo/getUserComboList',
    data: params,
    returnRawResponse: true
  })
}

export function createComboOrderApi(params: any) {
  return http.post<any>({
    url: '/admin/combo/createOrder',
    data: params,
    returnRawResponse: true
  })
}

export function getUserComboOrderListApi(params: any) {
  return http.post<any>({
    url: '/admin/combo/getUserOrderList',
    data: params,
    returnRawResponse: true
  })
}

export function changeComboOrderAutoRenewApi(params: any) {
  return http.post<any>({
    url: '/admin/combo/changeOrderAutoRenew',
    data: params,
    returnRawResponse: true
  })
}

export function renewComboOrderApi(params: any) {
  return http.post<any>({
    url: '/admin/combo/renewOrder',
    data: params,
    returnRawResponse: true
  })
}

export function getUserComboOrderNumberListApi(params: any) {
  return http.post<any>({
    url: '/admin/combo/getUserOrderNumberList',
    data: params,
    returnRawResponse: true
  })
}

export function exportComboOrderNumberApi(params: any) {
  return http.post<any>({
    url: '/admin/combo/exportUserOrderNumber',
    data: params,
    returnRawResponse: true
  })
}

export function refreshComboOrderTempTokenApi(params: any) {
  return http.post<any>({
    url: '/admin/combo/refreshOrderTempToken',
    data: params,
    returnRawResponse: true
  })
}

export function getDashboardApi() {
  return http.get<any>({
    url: '/admin/auth/dashboard',
    returnRawResponse: true
  })
}

export function accountResignApi(params: any) {
  return http.post<Api.BaseResponse>({
    url: '/admin/auth/accountResign',
    data: params,
    returnRawResponse: true
  })
}

export function getMyOrderListApi(params: any) {
  return http.post<any>({
    url: '/admin/order/getMyOrderList',
    data: params,
    returnRawResponse: true
  })
}

export function getAllCountryListApi() {
  return http.get<any>({
    url: '/admin/number/getAllCountryList',
    returnRawResponse: true
  })
}

export function getProjectListApi() {
  return http.get<any>({
    url: '/admin/number/getProjectList',
    returnRawResponse: true
  })
}

export function exportOrderApi(params: any) {
  return http.post<Api.BaseResponse>({
    url: '/admin/order/exportOrder',
    data: params,
    returnRawResponse: true
  })
}

export function getOrderDownListApi(params: any) {
  return http.post<any>({
    url: '/admin/order/getOrderDownList',
    data: params,
    returnRawResponse: true
  })
}

export function getOrderSummaryApi(params: any) {
  return http.post<any>({
    url: '/admin/order/summary',
    data: params,
    returnRawResponse: true
  })
}

export function getNumberLogListApi(params: any) {
  return http.post<any>({
    url: '/admin/number/getNumberLogList',
    data: params,
    returnRawResponse: true
  })
}

export function getProjectChannelUseListApi(params: any) {
  return http.post<any>({
    url: '/admin/number/getProjectChannelList',
    data: params,
    returnRawResponse: true
  })
}

export function getPhoneApi(params: any) {
  return http.post<any>({
    url: '/admin/number/getPhone',
    data: params,
    returnRawResponse: true
  })
}

export function getPhoneCodeApi(params: any) {
  return http.post<any>({
    url: '/admin/number/getPhoneCode',
    data: params,
    returnRawResponse: true
  })
}

export function addBlackApi(params: any) {
  return http.post<any>({
    url: '/admin/number/addBlack',
    data: params,
    returnRawResponse: true
  })
}

export function setRelApi(params: any) {
  return http.post<any>({
    url: '/admin/number/setRel',
    data: params,
    returnRawResponse: true
  })
}
