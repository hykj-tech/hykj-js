import {AxiosHeaders, AxiosProgressEvent} from 'axios';
import qs from 'qs'

const getResponse = (
  res: any,
  config: AxiosRequestConfigExtend,
  task: UniApp.RequestTask
) => {
  const {statusCode, errMsg, message} = res;
  return {
    ...res,
    status: statusCode,
    statusText: errMsg,
    config,
    request: task,
    message: message || errMsg,
  };
};

export const uniappAxiosAdapter = (config: AxiosRequestConfigExtend) => {
  if (!uni) {
    throw new Error(
      'global uni is not defined, please check if you are in uniapp environment'
    );
  }
  return new Promise((resolve, reject) => {
    const {baseURL, url, headers, data, params} = config;
    let headerToUse = {};
    if (headers && headers instanceof AxiosHeaders) {
      headerToUse = (headers as AxiosHeaders).toJSON();
    }
    const uniRequestConfig = {
      ...config,
      url: (baseURL || '') + url,
      header: headerToUse,
    } as any;

    if (data) {
      try {
        uniRequestConfig.data = JSON.parse(data);
      } catch (e) {
        uniRequestConfig.data = data;
      }
    }
    // 兼容axios在xhr下使用params是直接拼接在url后面的
    if (params) {
      const queryString = qs.stringify(params);
      // 如果url已经有参数了，就拼接在后面
      if (uniRequestConfig.url.indexOf('?') > -1) {
        uniRequestConfig.url += `&${queryString}`;
      } else {
        uniRequestConfig.url += `?${queryString}`;
      } 
    }
    let uniRequestTask:
      | UniApp.RequestTask
      | UniApp.UploadTask
      | UniApp.DownloadTask
    // 手动停止的处理
    let onCanceled: any;
    const done = () => {
      if (config.signal && config.signal instanceof AbortSignal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    };
    // config.signal处理
    if (config.signal && config.signal instanceof AbortSignal) {
      onCanceled = () => {
        if (!uniRequestTask) {
          return;
        }
        uniRequestTask.abort();
      };

      config.signal.aborted
        ? onCanceled()
        : config.signal.addEventListener('abort', onCanceled);
    }
    // 上传文件
    if (config.useFileUpload === true) {
      uniRequestTask = uni.uploadFile({
        ...uniRequestConfig,
        ...config.fileUploadParams,
        name: config.fileUploadParams?.name || 'file',
        success(res) {
          const response = getResponse(res, config, uniRequestTask);
          resolve(response);
          done();
        },
        fail(res) {
          const response = getResponse(res, config, uniRequestTask);
          reject(response);
          done();
        },
      }) as UniApp.UploadTask;
      // 处理上传进度显示
      (uniRequestTask as UniApp.UploadTask).onProgressUpdate(res => {
        if (typeof config.onUploadProgress === 'function') {
          const processEvent: AxiosProgressEvent = {
            loaded: res.totalBytesSent,
            total: res.totalBytesExpectedToSend,
            bytes: res.totalBytesExpectedToSend,
          };
          config.onUploadProgress(processEvent);
        }
      });
      // 下载文件
    } else if (config.useFileDownload === true) {
      uniRequestTask = uni.downloadFile({
        ...uniRequestConfig,
        success(res) {
          const resData = {
            ...res,
            data: {
              statusCode: res.statusCode,
              tempFilePath: res.tempFilePath,
            },
          };
          const response = getResponse(resData, config, uniRequestTask);
          resolve(response);
          done();
        },
        fail(res) {
          const resData = {
            ...res,
            data: {
              statusCode: res.statusCode,
              tempFilePath: res.tempFilePath,
            },
          };
          const response = getResponse(resData, config, uniRequestTask);
          reject(response);
          done();
        },
      }) as UniApp.DownloadTask;
      // 处理下载进度显示
      (uniRequestTask as UniApp.DownloadTask).onProgressUpdate(res => {
        if (typeof config.onDownloadProgress === 'function') {
          const processEvent: AxiosProgressEvent = {
            loaded: res.totalBytesWritten,
            total: res.totalBytesExpectedToWrite,
            bytes: res.totalBytesExpectedToWrite,
          };
          config.onDownloadProgress(processEvent);
        }
      });
    } else {
      // 普通请求
      uniRequestTask = uni.request({
        ...uniRequestConfig,
        success(res) {
          const response = getResponse(res, config, uniRequestTask);
          resolve(response);
          done();
        },
        fail(res) {
          const response = getResponse(res, config, uniRequestTask);
          reject(response);
          done();
        },
      }) as UniApp.RequestTask;
    }
  });
};

