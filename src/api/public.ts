import { http } from '@/lib/http';

export function getConfigApi() {
  return http.get<any>({
    url: '/open/base/getConfig',
    returnRawResponse: true
  });
}

//获取验证码
export function getCaptcha() {
  return http.post<Api.Captcha.CaptchaResponse>({
    url: '/open/base/getCaptcha'
  })
}