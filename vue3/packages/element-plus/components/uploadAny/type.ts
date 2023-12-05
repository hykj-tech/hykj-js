export interface UploadAnyFile {
  // 文件的名称，这个名称需要有后缀名，不然判断不了文件类型哦
  name?: string;
  // 最低要求必须存在的字段
  url: string;
  id?: string;
  // 文件的大小，单位字节
  fileSize?: number;
  // 文件的扩展名，一个储存值
  fileExtension?: string;
  // 文件在UploadAny组件内的逻辑属性，和业务数据无关，用于记录用户选中的文件和文件上传状态等
  // 在保存文件时必须注意不要储存这个东西
  raw?: {
    file: File;
    localUrl: string;
    response: any;
    status: 'success' | 'fail' | 'ready' | 'progress';
    progress: number;
    abortController: AbortController;
    abortSignal: AbortSignal;
    fileSizeLoading?: Boolean,
  };
}
