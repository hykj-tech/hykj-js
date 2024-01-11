// 这里提供一个Http工具类，要求使用时自行进行初始化，所有个性化配置均通过这个工具类实现
import Axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig,
  AxiosInstance
} from 'axios'

export type HttpUtilConfig = {
  requestTimeout?: number;
  BASE_URL?: string;
  statusValidator?: (status: number) => boolean;
  businessValidator?: (data: any) => boolean;
}

/**
 * 请求前置函数定义
 */
type BeforeFetchDataCallback = (config: AxiosRequestConfig) => void | Promise<void>;

/**
 * 请求后置函数定义
 */
type OnFetchDataErrorCallback = (
  error: HttpRequestError
) => void | Promise<void>;




function log(...args: any[]) {
  console.log('[httpRequest]', ...args);
}

export class HttpUtil {
  private C: HttpUtilConfig
  private axiosInstance: AxiosInstance
  private beforeFetchDataCallbackList: BeforeFetchDataCallback[] = [];
  private onFetchDataErrorCallbackList: OnFetchDataErrorCallback[] = [];

  constructor(config?: HttpUtilConfig) {
    this.C = Object.assign(  {
      requestTimeout: 5 * 60 * 1000,
      BASE_URL: ''
    }, config || {})
    this.axiosInstance = Axios.create({
      validateStatus: null,
      timeout: this.C.requestTimeout
    })
    // 拦截请求
    this.axiosInstance.interceptors.request.use(
      (config) =>{
        config.validateStatus = null;
        config.baseURL = this.definedBaseUrl(config);
        return config;
      },
      (error) =>{
        log(`请求发起中断:  ${error.message}, url: ${error.config.url} `);
        const err = new HttpRequestError(error);
        return Promise.reject(err);
      }
    )
    // 拦截响应
    this.axiosInstance.interceptors.response.use(
      (response) =>{
        const handler = new ResHandler(
          response,
          {
            statusValidator: this.C.statusValidator,
            businessValidator: this.C.businessValidator
          }
        );
        const [res, err] = handler.resolve();
        if (err) {
          return Promise.reject(err);
        }
        return res;
      },
      (error) =>{
        log(`请求响应中断：${error.message}, url: ${error.config.url}`);
        const err = new HttpRequestError(error);
        return Promise.reject(err);
      }
    )
  }

  private definedBaseUrl(config: AxiosRequestConfig) {
    let baseUrl = this.C.BASE_URL
    if (config.url?.startsWith('http')) {
      baseUrl = ''
    }
    return baseUrl
  }
  // 请求前后运行函数注册
  public onBeforeFetchData(callback: BeforeFetchDataCallback) {
    this.beforeFetchDataCallbackList.push(callback);
  }
  public onFetchDataError(callback: OnFetchDataErrorCallback) {
    this.onFetchDataErrorCallbackList.push(callback);
  }
  // 全局主请求方法
  public async FetchData<DataType = any>(
    requestOptions: AxiosRequestConfig
  ):Promise<[DataType | null, HttpRequestError | null]>{
    try {
      if (this.beforeFetchDataCallbackList.length) {
        for (const callback of this.beforeFetchDataCallbackList) {
          await callback(requestOptions);
        }
      }
      const res = await this.axiosInstance(requestOptions);
      const data = res.data as DataType;
      return [data, null] as const;
    } catch (err) {
      const error = err as HttpRequestError;
      if (this.onFetchDataErrorCallbackList.length) {
        for (const callback of this.onFetchDataErrorCallbackList) {
          await callback(error);
        }
      }
      const res = error.response;
      return [res?.data || null, error] as const;
    }
  }
}


/**
 * 响应处理
 */
class ResHandler {
  response: AxiosResponse;
  statusValidator: ((status: number) => boolean) | undefined;
  businessValidator: ((data: any) => boolean ) | undefined;
  constructor(
    response: AxiosResponse,
    options?: {
      statusValidator?: (status: number) => boolean,
      businessValidator?: (data:any) => boolean
    }
  ) {
    this.response = response;
    this.statusValidator = options?.statusValidator;
    this.businessValidator = options?.businessValidator;
  }
  get status() {
    return this.response.status;
  }
  // 校验http的响应状态码
  validateStatus() {
    let result = this.status >= 200 && this.status < 300;
    if (this.statusValidator) {
      result = Boolean(this.statusValidator(this.status));
    }
    return result;
  }

  // 校验返回的数据中的业务内容。默认校验code字段为200
  validateBusiness() {
    console.log(this.response)
    const code = this.response.data?.code;
    let result = code?.toString() === '200' ;
    if (this.businessValidator) {
      result = Boolean(this.businessValidator(this.response.data));
    }
    return result;
  }

  resolve(): [AxiosResponse, HttpRequestError | undefined] {
    let result = [this.response, undefined] as [
      AxiosResponse,
        HttpRequestError | undefined
    ];
    const config = this.response.config
    if (!Boolean(config.ignoreStatusValidate) && !this.validateStatus()) {
      const err = new HttpRequestError({
        message: `系统错误(statusCode:${this.status})`,
        config: this.response.config,
        response: this.response,
      });
      result = [this.response, err];
    }
    if (!Boolean(config.ignoreBusinessValidate) && !this.validateBusiness()) {
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
