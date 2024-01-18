// 记录当前调用的showToast流程
let globalToastList = [];
export const setUpUniSafeToast = ()=>{
  const originShowLoading = uni.showLoading;
  const originHideLoading = uni.hideLoading;
  const originShowToast = uni.showToast;
  const originHideToast = uni.hideToast;

// showLoading没有什么特殊东西需要拦截
  const showLoading = (options:Partial<UniApp.ShowLoadingOptions> = {}) => {
    originShowLoading(options);
  };

  const showToast = (options:Partial<UniApp.ShowToastOptions> = {}) => {
    originShowToast(options);
    const duration = options.duration || 1500;
    const toast = {duration, time: Date.now(), options};
    if (duration !== 0) {
      globalToastList.push(toast);
      setTimeout(() => {
        globalToastList = globalToastList.filter(item => item !== toast);
      }, duration);
    }
  };

// hideLoading需要拦截，如果当前有showToast的流程，就一直等待到没有
  const hideLoading = () => {
    if (globalToastList.length) {
      // setTimeout(() => {
      //   hideLoading();
      // }, 100);
    } else {
      originHideLoading();
    }
  };

// hideToast将立即清除当前的showToast流程
  const hideToast = () => {
    globalToastList = [];
    originHideToast();
  };

  uni.showToast = showToast;
  uni.showLoading = showLoading;
  uni.hideLoading = hideLoading;
  uni.hideToast = hideToast;

}
