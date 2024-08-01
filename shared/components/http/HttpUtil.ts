// 这里提供一个Http工具类，要求使用时自行进行初始化，所有个性化配置均通过这个工具类实现
import Axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosInstance,
} from "axios";

type BASEURL = string | (() => string);
export type HttpUtilConfig = {
  requestTimeout?: number;
  BASE_URL?: BASEURL;
  // http状态码校验定义
  statusValidator?: (status: number) => boolean;
  // 业务内容校验定义
  businessValidator?: (data: any) => boolean;
  // 业务错误的message字段
  businessErrorMessageFields?: string[];
  adapter?: (config: AxiosRequestConfigExtend) => Promise<any>;
};

/**
 * 请求前置函数定义
 */
type BeforeFetchDataCallback = (
  config: AxiosRequestConfigExtend
) => void | Promise<void>;

/**
 * 请求后置函数定义
 */
type AfterFetchDataCallback = (response: AxiosResponse) => void | Promise<void>;

/**
 * 请求出错函数定义
 */
type OnFetchDataErrorCallback = (
  error: HttpRequestError
) => void | Promise<void>;

function log(...args: any[]) {
  console.log("[httpRequest]", ...args);
}
function logError(...args: any[]) {
  console.error("[httpRequest]", ...args);
}

export class HttpUtil {
  private C: HttpUtilConfig;
  private axiosInstance: AxiosInstance;
  private beforeFetchDataCallbackList: BeforeFetchDataCallback[] = [];
  private onFetchDataErrorCallbackList: OnFetchDataErrorCallback[] = [];
  private afterFetchDataCallbackList: AfterFetchDataCallback[] = [];

  constructor(config?: HttpUtilConfig) {
    this.C = Object.assign(
      {
        requestTimeout: 5 * 60 * 1000,
        BASE_URL: "",
      },
      config || {}
    );
    this.axiosInstance = Axios.create({
      validateStatus: null,
      timeout: this.C.requestTimeout,
      adapter: this.C.adapter || undefined,
    });
    // 拦截请求
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.validateStatus = null;
        config.baseURL = this.definedBaseUrl(config);
        return config;
      },
      (error) => {
        if (!error.config) {
          log("请求流程内部错误:", error);
        }
        log(`请求发起中断:  ${error.message}, url: ${error.config.url} `);
        const err = new HttpRequestError(error);
        return Promise.reject(err);
      }
    );
    // 拦截响应
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const handler = new ResHandler(response, {
          statusValidator: this.C.statusValidator,
          businessValidator: this.C.businessValidator,
          businessErrorMessageFields: this.C.businessErrorMessageFields,
        });
        const [res, err] = handler.resolve();
        if (err) {
          return Promise.reject(err);
        }
        return res;
      },
      (error) => {
        if (!error.config) {
          log("请求流程内部错误:", error);
        }
        log(`请求响应中断：${error.message}, url: ${error.config.url}`);
        const err = new HttpRequestError(error);
        return Promise.reject(err);
      }
    );
  }

  private definedBaseUrl(config: AxiosRequestConfigExtend) {
    let baseUrl = "";
    if (typeof this.C.BASE_URL === "function") {
      baseUrl = this.C.BASE_URL();
    } else {
      baseUrl = this.C.BASE_URL || "";
    }
    if (config.url?.startsWith("http")) {
      baseUrl = "";
    }
    return baseUrl;
  }
  // 请求前后运行函数注册
  public onBeforeFetchData(callback: BeforeFetchDataCallback) {
    this.beforeFetchDataCallbackList.push(callback);
  }
  public onFetchDataError(callback: OnFetchDataErrorCallback) {
    this.onFetchDataErrorCallbackList.push(callback);
  }
  public onAfterFetchData(callback: AfterFetchDataCallback) {
    this.afterFetchDataCallbackList.push(callback);
  }
  // 全局主请求方法
  public async FetchData<DataType = any>(
    requestOptions: AxiosRequestConfigExtend
  ): Promise<[DataType | null, HttpRequestError | null, AxiosResponse | null]> {
    let res: AxiosResponse | null = null;
    try {
      try {
        if (this.beforeFetchDataCallbackList.length) {
          for (const callback of this.beforeFetchDataCallbackList) {
            await callback(requestOptions);
          }
        }
      } catch (err) {
        err.isCallbackError = true;
        throw err;
      }
      res = await this.axiosInstance({
        ...requestOptions,
        // 默认请求/
        url: requestOptions.url || "/",
      });
      if (this.afterFetchDataCallbackList.length) {
        try {
          for (const callback of this.afterFetchDataCallbackList) {
            await callback(res);
          }
        } catch (err) {
          err.isCallbackError = true;
          throw err;
        }
      }
      return [res.data as DataType, null, res];
    } catch (err) {
      if (err.isCallbackError && res) {
        err.response = res;
        err.config = res.config;
        res.request = res.request;
      }
      let error: HttpRequestError = err;
      if (!(error instanceof HttpRequestError)) {
        error = new HttpRequestError(err, requestOptions.url);
      }
      try {
        if (this.onFetchDataErrorCallbackList.length) {
          for (const callback of this.onFetchDataErrorCallbackList) {
            await callback(error);
          }
        }
      } catch (err) {
        // onFetchDataError回调中的错误不会再继续处理
        logError("onFetchDataErrorCallback error: ", err);
      }
      // const res = error.response;
      return [null, error, res];
    }
  }
}

/**
 * 响应处理
 */
class ResHandler {
  response: AxiosResponse;
  statusValidator: ((status: number) => boolean) | undefined;
  businessValidator: ((data: any) => boolean) | undefined;
  businessErrorMessageFields: string[];
  constructor(
    response: AxiosResponse,
    options?: {
      statusValidator?: (status: number) => boolean;
      businessValidator?: (data: any) => boolean;
      businessErrorMessageFields?: string[];
    }
  ) {
    this.response = response;
    this.statusValidator = options?.statusValidator;
    this.businessValidator = options?.businessValidator;
    this.businessErrorMessageFields = options?.businessErrorMessageFields || [
      "msg",
      "errmsg",
      "message",
    ];
  }
  get status() {
    return this.response.status;
  }
  // 校验http的响应状态码
  validateStatus() {
    // 默认校验状态码为200-300之间
    let result = this.status >= 200 && this.status < 300;
    if (this.statusValidator) {
      result = Boolean(this.statusValidator(this.status));
    }
    return result;
  }

  // 校验返回的数据中的业务内容。默认不对业务数据做处理
  validateBusiness() {
    let result = true;
    if (this.businessValidator) {
      result = Boolean(this.businessValidator(this.response.data));
    }
    return result;
  }

  resolve(): [AxiosResponse | null, HttpRequestError | null] {
    let result = [this.response, null] as [
      AxiosResponse | null,
      HttpRequestError | null
    ];
    const config = this.response.config as AxiosRequestConfigExtend;
    // 这个时候是status错误
    if (!Boolean(config.ignoreStatusValidate) && !this.validateStatus()) {
      const err = new HttpRequestError({
        message: `HTTP错误(${this.status})`,
        config: this.response.config,
        response: this.response,
      });
      result = [null, err];
      return result;
    }
    // 开始校验业务错误
    if (!Boolean(config.ignoreBusinessValidate) && !this.validateBusiness()) {
      let message = "请求出错";
      for (const field of this.businessErrorMessageFields) {
        const messageGet = this.response.data[field];
        if (messageGet) {
          message = messageGet;
          break;
        }
      }
      const err = new HttpRequestError({
        message: `${message}`,
        config: this.response.config,
        response: this.response,
      });
      result = [null, err];
      return result;
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
   * afterSuccess: 自定义的业务错误，比如http状态码错误，或者其他业务错误
   * callback: 在请求前置和后置函数中发生的错误
   */
  type: "request" | "response" | "afterSuccess" | "callback";
  requestUrl: string;
  #config: (InternalAxiosRequestConfig & AxiosRequestConfigExtend) | undefined;
  #response: AxiosResponse | undefined;
  #request: any | undefined;
  // error一般是axios的error错误，也有可能是callback的普通错误
  constructor(error: any, urlInput: string = "") {
    super(error.message);
    this.#config = error.config;
    if (!error.isCallbackError) {
      if (error.response) {
        // The request was made and the server responded with a status code
        this.type = "afterSuccess";
        this.#response = error.response;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        this.type = "response";
      } else {
        this.#request = error.request;
        // Something happened in setting up the request that triggered an Error
        this.type = "request";
      }
    } else {
      this.type = "callback";
    }
    // 记录请求路径
    const { baseURL, url, params } = this.#config;
    const urlFromConfig = (baseURL || "") + (url || "");
    // const paramsStringFromConfig = new URLSearchParams(params).toString();
    // 换一种写法，URLSearchParams在uni-app中不支持
    let paramsStringFromConfig = "";
    if (params) {
      const keys = Object.keys(params);
      paramsStringFromConfig = keys
        .map((key) => `${key}=${params[key]}`)
        .join("&");
    }
    this.requestUrl =
      (urlFromConfig || urlInput) +
      (paramsStringFromConfig ? `?${paramsStringFromConfig}` : "");
  }
  get config(): InternalAxiosRequestConfig & AxiosRequestConfigExtend {
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
  get isAfterSuccess() {
    return this.type === "afterSuccess";
  }
  get isAbort() {
    const keywords = ["abort", "cancel"];
    return keywords.some((keyword) => this.message.includes(keyword));
  }
  get isTimeout() {
    return this.message.includes("timeout");
  }
}
