interface BaseAxiosConfigExtend {
  // 是否使用文件上传，默认采用uni的统一上传api
  useFileUpload?: boolean;
  // 是否使用下载文件，默认采用uni的统一下载api
  useFileDownload?: boolean;
  // 文件上传时的的请求参数类型, 参照https://uniapp.dcloud.net.cn/api/request/network-file.html
  fileUploadParams?: {
    files?: Array<string | File>;
    fileType?: 'image' | 'video' | 'audio';
    file?: File;
    filePath?: string;
    name?: string;
    formData?: Record<string, any>;
  };
}
