import {FileType} from "./utils";
import {BeforeNormalUploadPayload} from "./configUpload";

/**
 * 上传文件的数据结构
 */
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

/**
 * 组件状态
 */
export type UploadAnySate ={
  uploading: boolean;
  fileList: UploadAnyFile[];
}

/**
 * 组件属性
 */
export type UploadAnyProps = {
  // 是否允许上传多个
  multiple?: boolean;
  // 上传的文件类型（预设类型），可多选(数组)，'image' | 'audio' | 'video' | 'document' | 'archive'
  fileType?: FileType[] | 'image' | 'audio' | 'video' | 'document' | 'archive';
  // 单独限制的格式,若fileType和accept都指定，将合并两者的限制,如只要显示上传pdf：:accept="['pdf']"
  // image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
  // document: ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'ppt', 'pptx'],
  accept?: string[];
  // 上传的文件大小限制
  sizeLimit?: number;
  // 上传的文件数量限制
  limit?: number;
  // 绑定的文件
  fileList?: UploadAnyFile[];
  // 是否采用分片上传, 默认为自动超过5M使用分片上传
  chunk?: boolean | 'auto';
  // 是否禁用
  disabled?: boolean;
  // 独立模式，不使用文件列表显示，只使用本组件的上传逻辑
  standalone?: boolean;
  // 储存桶命名
  bucketModuleName?: string;
  // 自定义beforeNormalUpload
  beforeNormalUpload?: (payload: BeforeNormalUploadPayload) => Promise<void>;
}

