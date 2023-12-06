import {ElMessageBox} from "element-plus";

type LoadingConfirmOptions = {
  // 标题
  title?: string,
    // 内容
  message?: string,
    // 确定按钮文字
  confirmButtonText?: string,
    // 取消按钮文字
  cancelButtonText?: string,
    // loading中的文字
  loadingText?: string,
    // 是否显示取消按钮
  showCancelButton?: boolean,
    // 使用html渲染
  html?: boolean,
}

type LoadingConfirmAsyncFn = (action: 'confirm' | 'cancel' | 'close') => Promise<void>;

/**
 * ElMessageBox异步封装
 */
export const loadingConfirm = (options : LoadingConfirmOptions, asyncFn:LoadingConfirmAsyncFn) => {
  const title = options.title || '提示';
  const message = options.message || '确定执行此操作吗？';
  const confirmButtonText = options.confirmButtonText || '确定';
  const cancelButtonText = options.cancelButtonText || '取消';
  const loadingText = options.loadingText || '执行中...';
  const showCancelButton = options.showCancelButton === undefined ? true : options.showCancelButton;
  const dangerouslyUseHTMLString = options.html === undefined ? false : options.html;
  return ElMessageBox({
    closeOnPressEscape: false,
    closeOnClickModal: false,
    title,
    message,
    showCancelButton,
    confirmButtonText,
    cancelButtonText,
    dangerouslyUseHTMLString,
    beforeClose: async (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true;
        instance.confirmButtonText = loadingText;
        try {
          if (asyncFn && typeof asyncFn === 'function') {
            await asyncFn(action);
          }
          done();
        } finally {
          instance.confirmButtonLoading = false;
          instance.confirmButtonText = confirmButtonText;
        }
      } else {
        done();
      }
    }
  });
}

import {ElMessage} from 'element-plus';
import type {HttpRequestError} from '@hykj-ks/shared'
/**
 * 前端统一提示请求错误方法；
 * @param error
 */
export function requestErrorMessage(error: HttpRequestError) {
  let messageShow = '请求失败，请检查网络或服';
  console.log(error);
  if (error.isAbort) {
    messageShow = '';
  }
  if (error.isTimeout) {
    messageShow = '请求超时';
  }
  if (error.isBusiness) {
    messageShow = error.message
  }
  if (!messageShow) return;
  ElMessage({
    message: messageShow,
    type: 'error',
    duration: 2000,
    showClose: true,
  })
}
