import Axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig,
} from 'axios';


let REQUEST_TIMEOUT = 5 * 60 * 1000;
let BASE_URL = '';
let IS_Browser = true;

type FetchDataUtilEnv = {
  REQUEST_TIMEOUT?: number;
  BASE_URL?: string;
  IS_Browser?: boolean;
}

/**
 * 供外部使用配置基本变量
 * @param config
 */
export const configureFetchDataEnv = (config: FetchDataUtilEnv) => {
  const { REQUEST_TIMEOUT: timeout, BASE_URL: baseUrl, IS_Browser: isBrowser } = config;
  if (timeout) {
    REQUEST_TIMEOUT = timeout;
  }
  if (baseUrl) {
    BASE_URL = baseUrl;
  }
  if (isBrowser !== undefined) {
    IS_Browser = isBrowser;
  }
}

// 公共请求工具
const httpRequest = Axios.create({
  validateStatus: null,
  timeout: REQUEST_TIMEOUT || 5 * 60 * 1000
});

/**
 * 接口请求baseUrl配置
 * 因为这个模块要被不同环境使用，两种不同环境逻辑不同：
 * 后端node环境下，应用backendUrl配置，指定确切的请求地址
 * 前端浏览器环境下，默认采用devServer的Proxy功能，不需要配置baseUrl
 * @param config
 */
function definedBaseUrl(config: AxiosRequestConfig) {
  // 配置baseUrl,默认采用后端API做为baseURL
  let baseUrl = BASE_URL;
  // 如果当前环境是浏览器，默认不设置baseURL
  // if (IS_Browser) {
  //   baseUrl = '';
  // }
  // 如果config.url已经是完整的url，则不需要拼接
  if (config.url?.startsWith('http')) {
    baseUrl = '';
  }
  return baseUrl;
}

/**
 * axios在nodejs下使用https_proxy变量时存在bug,关闭proxy设置
 * https://github.com/axios/axios/issues/4369
 * @param config
 */
function nodejsAxiosProxyHandler(config: AxiosRequestConfig) {
  if (!IS_Browser) {
    config.proxy = false;
  }
}

httpRequest.interceptors.request.use(
  function (config) {
    config.validateStatus = null;
    config.baseURL = definedBaseUrl(config);
    nodejsAxiosProxyHandler(config);
    return config;
  },
  function (error) {
    log(`请求发起中断:  ${error.message}, url: ${error.config.url} `);
    const err = new HttpRequestError(error);
    return Promise.reject(err);
  }
);

httpRequest.interceptors.response.use(
  function (response) {
    const handler = new BusinessResHandler(response);
    const [res, err] = handler.resolve();
    if (err) {
      return Promise.reject(err);
    }
    return res;
  },
  function (error) {
    log(`请求响应中断：${error.message}, url: ${error.config.url}`);
    const err = new HttpRequestError(error);
    return Promise.reject(err);
  }
);

function log(...args: any[]) {
  console.log('[httpRequest]', ...args);
}

/**
 * 业务响应处理
 */
class BusinessResHandler {
  response: AxiosResponse;
  constructor(response: AxiosResponse) {
    this.response = response;
  }
  get status() {
    return this.response.status;
  }
  get code() {
    return this.response.data?.code;
  }
  // 校验http的响应状态码
  validateStatus() {
    return this.status >= 200 && this.status < 300;
  }
  // 校验返回的数据中的业务code
  validateCode() {
    if (!this.code) {
      return true;
    }
    return this.code === 200;
  }
  resolve(): [AxiosResponse, HttpRequestError | undefined] {
    let result = [this.response, undefined] as [
      AxiosResponse,
      HttpRequestError | undefined
    ];
    if (!this.validateStatus()) {
      const err = new HttpRequestError({
        message: `系统错误(statusCode:${this.status})`,
        config: this.response.config,
        response: this.response,
      });
      result = [this.response, err];
    }
    if (!this.validateCode()) {
      const message =
        this.response.data?.msg || this.response.data?.message || '请求出错';
      const err = new HttpRequestError({
        // message: `${message}(code:${this.code})`,
        message: `${message}`,
        config: this.response.config,
        response: this.response,
      });
      result = [this.response, err];
    }
    return result;
  }
}

/**
 * 全局通用的请求错误捕获
 */
export class HttpRequestError extends Error {
  /**
   * 错误发生阶段，描述错误是在什么阶段发生的，
   * request: 请求发起阶段，比如网络异常，浏览器阻止等
   * response: 请求响应阶段，比如超时、用户中断，服务器无响应，或服务器直接断开链接无数据等
   * business: 自定义的业务错误
   */
  type: 'request' | 'response' | 'business';
  requestUrl: string;
  #config: InternalAxiosRequestConfig;
  #response: AxiosResponse | undefined;
  #request: any | undefined;
  constructor(error: any) {
    super(error.message);
    this.#config = error.config;
    if (error.response) {
      // The request was made and the server responded with a status code
      this.type = 'business';
      this.#response = error.response;
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      this.type = 'response';
    } else {
      this.#request = error.request;
      // Something happened in setting up the request that triggered an Error
      this.type = 'request';
    }
    // 记录请求路径
    const { baseURL, url, params } = this.#config;
    const urlFromConfig = (baseURL || '') + (url || '');
    const paramsStringFromConfig = new URLSearchParams(params).toString();
    this.requestUrl =
      urlFromConfig +
      (paramsStringFromConfig ? `?${paramsStringFromConfig}` : '');
  }
  get config(): InternalAxiosRequestConfig {
    return this.#config;
  }
  get response(): AxiosResponse | undefined {
    return this.#response;
  }
  get request(): any | undefined {
    return this.#request;
  }
  /**
   * 判断错误是否是业务阶段的错误
   * @returns
   */
  get isBusiness() {
    return this.type === 'business';
  }
  get isAbort() {
    const keywords = ['abort', 'cancel'];
    return keywords.some((keyword) => this.message.includes(keyword));
  }
  get isTimeout() {
    return this.message.includes('timeout');
  }
}

/**
 * 根返回VO
 */
export interface RootResVO {
  code: number,
  msg: string | 'Success',
  data: any,
}

/**
 * 基础返回VO
 */
export interface BaseVO<Data = any | Array<any> | null> extends RootResVO {
  data: Data;
}

/**
 * 树形数据对象
 */
interface treeObj {
  childList: Array<treeObj>;
}
/**
 * 树形返回VO
 */
export interface TreeVO extends RootResVO {
  data: treeObj[];
}
/**
 * 分页返回VO
 */
export interface PageVO<RowType = any> extends RootResVO {
  data: {
    records: RowType[];
    total: number;
    size: number;
    current: number;
    other: any[];
    pages: number;
  };
}

export interface PageVO_Type2<RowType = any> extends RootResVO {
  data: {
    page: {
      records: RowType[];
      total: number;
      size: number;
      current: number;
      other: any[];
      pages: number;
    };
  };
}
export interface PageVO_Type3<RowType = any> extends RootResVO {
  data: {
    page: {
      records: RowType[];
      total: number;
      size: number;
      current: number;
      other: any[];
      pages: number;
    };
          issueModel:string,

  };
}
/**
 * 列表返回VO
 */
export interface ListVO<RowType = any> extends RootResVO {
  data: RowType[];
}

// 为了在不同端（服务端渲染和客户端浏览器）上能够自定义统一全局设置config和拦截error
// 在FetchData方法前后增加回掉函数，在各自端上对本模块的两个回掉函数池进行定义

/**
 * 全局FetchData前置函数
 */
type BeforeFetchDataCallback = (config: AxiosRequestConfig) => void | Promise<void>;

/**
 * 全局FetchData错误回调函数
 */
type OnFetchDataErrorCallback = (
  error: HttpRequestError
) => void | Promise<void>;

/**
 * 全局FetchData前置函数列表
 */
const beforeFetchDataCallbackList: BeforeFetchDataCallback[] = [];

/**
 * 全局FetchData错误回调函数列表
 */
const onFetchDataErrorCallBackList: OnFetchDataErrorCallback[] = [];

/**
 * 注册 beforeFetchData回调
 * @param callback
 */
export const onBeforeFetchData = (callback: BeforeFetchDataCallback) => {
  beforeFetchDataCallbackList.push(callback);
};

/**
 * 注册onFetchDataError回掉
 * @param callback
 */
export const onFetchDataError = (callback: OnFetchDataErrorCallback) => {
  onFetchDataErrorCallBackList.push(callback);
};

/**
 * 统一http请求包装
 * 这个封装目的是提供dataType范型，并在内部逻辑进行data数据的获取和错误捕获
 * 使用时，只需使用数组进行解构获取，自行判断错误即可
 * @param requestOptions 请求定义
 */
export async function FetchData<dataType = BaseVO>(
  requestOptions: AxiosRequestConfig
): Promise<[dataType, HttpRequestError | null]> {
  try {
    if (beforeFetchDataCallbackList.length) {
      for (const callback of beforeFetchDataCallbackList) {
        await callback(requestOptions);
      }
    }
    const res = await httpRequest(requestOptions);
    const data = res.data as dataType;
    return [data, null];
  } catch (err) {
    const error = err as HttpRequestError;
    if (onFetchDataErrorCallBackList.length) {
      for (const callback of onFetchDataErrorCallBackList) {
        await callback(error);
      }
    }
    const res = error.response;
    return [res?.data || {}, error];
  }
}
