// 导出图片,archive,audio,doc,pdf,ppt,txt,unknown,video,xls
import {getFileExtension} from '../utils';
import archive from './archive.png';
import audio from './audio.png';
import doc from './doc.png';
import pdf from './pdf.png';
import ppt from './ppt.png';
import txt from './txt.png';
import unknownFile from './unknown.png';
import video from './video.png';
import xls from './xls.png';

export const fileTypeImage = {
  archive,
  audio,
  doc,
  pdf,
  ppt,
  txt,
  unknownFile,
  video,
  xls,
}; 

// 根据后缀名
export const getFileTypeImage = (fileName: string) => {
  const fileExtension = getFileExtension(fileName);
  const map = {
    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
    doc: ['doc', 'docx'],
    pdf: ['pdf'],
    ppt: ['ppt', 'pptx'],
    txt: ['txt'],
    video: ['mp4', 'avi', 'rmvb', 'rm', 'flv', 'mkv', 'mov', 'wmv', 'asf', '3gp', 'mpeg', 'mpg', 'dat', 'ts', 'mts', 'vob'],
    xls: ['xls', 'xlsx'],
  };
  let result = fileTypeImage.unknownFile;
  for (const key in map) {
    const k = key as keyof typeof map;
    if (map[k].includes((fileExtension as string).toLowerCase())) {
      result = fileTypeImage[k];
      break;
    }
  }
  return result;
}