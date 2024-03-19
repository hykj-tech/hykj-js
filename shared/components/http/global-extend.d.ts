import {HttpRequestError} from './HttpUtil';
import {AxiosRequestConfig} from 'axios';

declare global {
  interface BaseAxiosConfigExtend {
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
  type AxiosRequestConfigExtend = AxiosRequestConfig & BaseAxiosConfigExtend;
  // 全局方法定义
  type FetchDataFn = <DataType = any>(
    requestOptions: AxiosRequestConfigExtend
  ) => Promise<[DataType | null, HttpRequestError | null]>;

  // 全局注入定义
  interface Window {
    FetchData: FetchDataFn;
  }

  const FetchData: FetchDataFn;
}

export {};
