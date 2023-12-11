// 通过函数式直接调用dialog.vue组件完成文件预览
import previewDialog from './previewDialog.vue';

// 获取文件预览站点url
export const getFilePreviewSiteUrl = (
  url: string,
  // kkFileViewBaseUrl?: string
) => {
  // http://kkfileview.keking.cn/zh-cn/docs/production.html
  // 这里使用系统提供的kkfile文件预览功能，能够预览常见文档格式、多媒体格式
  // 要求的地址格式/onlinePreview?url=encodeURIComponent(Base64.encode(previewUrl)));
  // 这里使用的配置准讯外部传入配置，使用window.CONFIG兜底, 最后会使用本域下/preview目录
  // const fileViewBaseUrl = kkFileViewBaseUrl || window.CONFIG.kkFileViewConfig?.baseUrl || '/preview'
  // return `${fileViewBaseUrl}/onlinePreview?url=${encodeURIComponent(Base64.encode(url))}`
  // 本系统暂时不支持kkfile预览
  return url;
}

interface MediaFilePreviewOptions {
  title?: string,
  // 直接指定kkFileView的baseUrl
  kkFileViewBaseUrl?: string,
  // 不使用dialog而是直接使用window.open
  useWindowOpen?: boolean,
  previewType?: 'video' | 'audio' | 'document' | 'archive' | string
}
import { createApp } from 'vue';
import {previewDialogBus} from "./event.ts";

/**
 * 打开文件预览对话框
 * @param url
 * @param options
 */
export const mediaFilePreview = (url: string, options?: MediaFilePreviewOptions) => {
  const {title,
    // kkFileViewBaseUrl,
     useWindowOpen, previewType} = options || {};
  const previewUrl = getFilePreviewSiteUrl(
    url,
    // kkFileViewBaseUrl
  );
  if (useWindowOpen) {
    window.open(previewUrl);
    return;
  }
  const instanceApp = createApp(previewDialog,{
      previewUrl,
      previewType: previewType,
      title,
  })
  const el = document.createElement('div');
  const vm  = instanceApp.mount(el);
  document.body.appendChild(vm.$el);
  // 加载后，调用组件open方法
  vm.$nextTick().then(()=>{
    (vm as any).open()
  })
  function onClose(){
    instanceApp.unmount();
    previewDialogBus.off('close', onClose);
  }
  previewDialogBus.on('close', onClose);
  // 监听组件触发close事件，销毁组件，删除dom
  // instance.$on('close', () => {
  //   console.log('destroy')
  //   setTimeout(() => {
  //     instance.$destroy();
  //     console.log('destroy')
  //   }, 500)
  // })
}

export default mediaFilePreview
