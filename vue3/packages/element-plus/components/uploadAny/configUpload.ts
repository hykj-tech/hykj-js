import {UploadAnyFile, UploadAnyProps} from "./type";

export type BeforeNormalUploadPayload = {
  file:UploadAnyFile;
  uploadAnyProps:Readonly<UploadAnyProps>;
  method:  'post' | 'put' | 'patch';
  formData:FormData;
  url: string;
  additionalHeader: Record<string, string>;
  userContext: UploadAnyUserContext | null;
}

/**
 * 上传前的钩子函数，传入payload，要求对payload内的数据进行调整，主要是调整url、formData和additionalHeader
 */
export type BeforeNormalUploadFunc = (payload:BeforeNormalUploadPayload)=>Promise<void> | void;

/**
 * 钩子队列
 */
export const onBeforeNormalUploadFuncList = [] as BeforeNormalUploadFunc[];

/**
 * 添加上传前的钩子函数,供最终外部使用
 */
export function onBeforeNormalUpload(func:BeforeNormalUploadFunc) {
  onBeforeNormalUploadFuncList.push(func);
}

