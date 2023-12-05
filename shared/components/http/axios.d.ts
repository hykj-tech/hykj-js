import {AxiosRequestConfig as OriginalAxiosRequestConfig} from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig extends OriginalAxiosRequestConfig {
    // 自定义axios配置扩展
    // 是否禁用自动错误信息的ElMessage提示
    disableAutoMessage?: boolean;
    // 不添加系统的Authorization头部
    disableAuthorization?: boolean;
  }
}
