declare namespace Api {
  export interface BaseResponse<T = any> {
    code: number;
    data: T;
    message?: string;
    msg?: string;
    time?: number;
  }

  declare namespace Captcha {
    /** 验证码响应 */
    interface CaptchaResponse {
      image: string
      key: string
    }
  }

  declare namespace SmsCode {
    /** 验证码响应 */
    interface SmsCodeRequest {
      phone: string
      action: string
    }
  }

  export namespace Auth {
    export interface UserInfo {
      id: number;
      gender: number;
      phone: string;
      email: string;
      address: string;
      alipayAvatar: string | null;
      alipayNickname: string | null;
      alipayOpenid: string | null;
      apiKey: string;
      avatar: string;
      balance: string;
      company: {
        id: number;
        level: number;
        name: string;
        code: string;
        address: string;
        status: boolean;
      };
      companyId: number;
      createTime: string;
      dataScope: number;
      deleteTime: string | null;
      deptCode: string;
      deptId: number;
      deptInfo: {
        id: number;
        name: string;
        code: string;
      };
      deptName: string;
      douyinAvatar: string | null;
      douyinNickname: string | null;
      douyinOpenid: string | null;
      freezeBalance: string;
      idCard: string | null;
      invCode: string | null;
      isOpenApi: boolean;
      ksAvatar: string | null;
      ksNickname: string | null;
      ksOpenid: string | null;
      lastLoginDevice: string;
      lastLoginIp: string;
      lastLoginTime: string;
      location: string;
      nickName: string;
      passWord?: string;
      payPass: string | null;
      qqAvatar: string | null;
      qqNickname: string | null;
      qqOpenid: string | null;
      rankId: number;
      rankInfo: {
        id: number;
        name: string;
        sort: number;
      };
      rankName: string;
      rankSort: number;
      realName: string;
      remark: string;
      renameStatus: boolean;
      roleIds: number[];
      rolesCode: string[];
      status: number;
      updateTime: string;
      userId: number;
      userName: string;
      userType: number;
      whiteIp: string | null;
      wxAvatar: string | null;
      wxMpOpenid: string | null;
      wxNickname: string | null;
      wxOpenid: string | null;
      callbackUrl: string | null;
    }

    export interface LoginParams {
      email?: string;
      userName?: string;
      username?: string;
      password?: string;
      [key: string]: any;
    }

    export interface LoginData {
      expiresIn: number;
      refreshToken: string;
      token: string;
    }

    export type LoginResponse = BaseResponse<LoginData>

    export type UserInfoResponse = BaseResponse<UserInfo>

    export interface RefreshTokenParams {
      refreshToken: string;
    }
  }
}
