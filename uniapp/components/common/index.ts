import {HttpRequestError} from "@hykj-js/shared";
export * from './uniSafeToast'
/**
 * 前端统一提示请求错误方法；
 * @param error
 */
export function requestErrorMessage(error: HttpRequestError) {
  let messageShow = '请求失败，请检查网络或服';
  // console.log(error);
  if (error.isAbort) {
    messageShow = '';
  }
  if (error.isTimeout) {
    messageShow = '请求超时';
  }
  if (error.isBusiness) {
    messageShow = error.message;
  }
  if (!messageShow) return;
  uni.showToast({
    title: messageShow,
    icon: 'none',
    duration: 2000,
  });
}
