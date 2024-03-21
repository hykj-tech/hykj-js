import {UploadAnyFile} from "./type";

export type FileType = 'image' | 'audio' | 'video' | 'document' | 'archive';
// 常见文件类型
export const fileTypes = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ifft', 'jfif'],
  audio: ['mp3', 'wmv', 'ogg', 'aac', 'wav', 'ape', 'flac'],
  video: [
    'mp4',
    'avi',
    'rmvb',
    'mkv',
    'wmv',
    'flv',
    'mov',
    'mpg',
    'mpeg',
    '3gp',
    'm4v',
    'rm',
    'webm',
  ],
  document: ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'ppt', 'pptx'],
  archive: ['zip', 'rar', '7z', 'gz', 'tar'],
};

// 判断文件名是否属于某类文件
export const isFileType = (fileName: string, type: FileType) => {
  if (!fileName) return false;
  const fileType = fileName.split('.').pop();
  return fileTypes[type].includes(fileType?.toLowerCase() || '');
};

export function getFileExtension(fileName: string) {
  return fileName?.split('.').filter(i=> !!i).pop() || '';
}

export function getFileTypeFromFilename(fileName: string) {
  const fileExtension = getFileExtension(fileName);
  return Object.keys(fileTypes).find(type => {
    const t = type as FileType;
    const fileType = fileTypes[t];
    return fileType.includes(fileExtension?.toLowerCase() || '');
  });
}

import byteSize from 'byte-size';
import UploadAny from "./uploadAny.vue";

export function getFileSize(size: number) {
  // 如果size不是有效的数字，直接返回空
  const number = Number(size);
  if (Number.isNaN(number)) return '';
  const result = byteSize(size, {precision: 2, units: 'iec'}).toString();
  // 去除iec单位中的i
  return result.replace('i', '');
}

/**
 * 通常的，UploadAnyFile包含了raw字段，是不需要保存的，这里供外部使用直接获取简化的文件对象
 * @param file
 */
export function simplifyUploadAnyFile(file: UploadAnyFile) {
  if(!file) return null;
  const {name, fileSize, fileExtension, url, id} = file;
  return {
    name,
    fileSize,
    fileExtension,
    url,
    link: url,
    id
  };
}

/**
 * simpleUploadAnyFile的别名
 * @param file
 */
export function toFileObject(file: UploadAnyFile) {
  return simplifyUploadAnyFile(file)
}


/**
 * 一个通用的通过fetch快速获取文件的大小，用于uploadAny组件自动获取没有fileSize的文件的大小
 * 这个方法如果服务器不允许跨域访问文件读取content-length，则不会成功
 * @param fileUrl
 */
export async function getFileSizeByFetch(fileUrl: string){
  try {
    let response = await fetch(fileUrl, {
      method: 'HEAD',
    });
    const Location = response.headers.get('Location');
    // 如果是302，且存在Location，那么就是重定向，需要再次请求
    if(response.status === 302 && Location){
      response = await fetch(Location!, {
        method: 'HEAD',
      });
    }
    const size = response.headers.get('Content-Length');
    return Number(size);
  } catch (e) {
    return null;
  }
}

// 供外部vue组件使用的通用文件校验

/**
 * 上传组件校验
 * @param uploaderList
 */
export const batchCheckUploader = (uploaderList: InstanceType<typeof UploadAny>[]) => {
  const result = {
    ok:true,
    message: ''
  }
  for(const uploader of uploaderList || []){
    if(uploader && uploader.isUploading && uploader.isAllFileSuccess){
      // 有文件正在上传中
      if(uploader.isUploading()){
        // 找到正在上传的文件
        const fileList = uploader.getFileList() as UploadAnyFile[]
        const uploadingFile = fileList.find((file: any) => file.raw?.status === 'uploading')
        result.ok = false
        result.message = `文件${uploadingFile?.name || ''}正在上传中，请等待上传成功后提交`
        break
      }
      // 有文件上传失败
      if(!uploader.isAllFileSuccess()){
        // 找到上传失败的文件
        const fileList = uploader.getFileList() as UploadAnyFile[]
        const failFile = fileList.find((file: any) => file.raw?.status === 'fail')
        result.ok = false
        result.message = `文件${failFile?.name || ''}未上传成功的文件，请上传成功后提交`
        break
      }
    }
  }
  return result
}

