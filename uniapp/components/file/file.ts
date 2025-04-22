// 这个模块要求FetchData已经被全局注入

// 通用文件上传接口
export const commonFileUpload = async (
  file: string | File,
  url: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
  otherParams?: {
    // 仅支付宝小程序使用
    fileType?: 'image' | 'video' | 'audio' 
    header?: Record<string, string>
    // 上传文件其他参数
    formData?: Record<string, any>
    timeout?: number
  }, 
) => {
  return FetchData({
    url: url,
    ignoreBusinessValidate: true,
    useFileUpload: true,
    signal: signal ?? undefined,
    fileUploadParams: {
      // file: file instanceof File ? file : undefined,
      file: file as File,
      filePath: typeof file === 'string' ? file : undefined,
      header: otherParams?.header,
      formData: otherParams?.formData,
      timeout: otherParams?.timeout,
    },
    onUploadProgress: e => {
      if (onProgress) {
        if (!e.total) return onProgress(0);
        onProgress(Math.ceil((e.loaded / e.total) * 100));
      }
    },
  });
};


// uni下载文件
export const uniDownloadFile = async (
  url: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
) => {
  return FetchData<UniApp.DownloadSuccessData>({
    url,
    ignoreBusinessValidate: true,
    useFileDownload: true,
    disableAuthorization: true,
    signal: signal ?? undefined,
    onDownloadProgress: e => {
      if (onProgress) {
        if (!e.total) return onProgress(0);
        onProgress(Math.ceil((e.loaded / e.total) * 100));
      }
    },
  });
};
