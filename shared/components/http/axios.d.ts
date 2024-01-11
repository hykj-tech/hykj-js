import {AxiosRequestConfig as OriginalAxiosRequestConfig} from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig extends OriginalAxiosRequestConfig {
    // 自定义axios配置扩展
    // 是否禁用自动错误信息的ElMessage提示
    disableAutoMessage?: boolean;
    // 不添加系统的Authorization头部，这个在HttpUtil中不体现，供外部定义beforeFetchData时使用
    disableAuthorization?: boolean;
    // 不对状态码进行校验
    ignoreStatusValidate?: boolean;
    // 不对业务数据进行校验
    ignoreBusinessValidate?: boolean;
  }
}
