import { HttpUtil } from '@hykj-js/shared'
import { requestErrorMessage } from '@hykj-js/vue3-element-plus'

let httpUtil: HttpUtil

/**
 * 这个方法会初始化http请求工具，创建一个HttpUtil类，进行配置,并挂载其FetchData方法到全局
 */
export function initHttpUtil() {
  httpUtil = new HttpUtil({
    // 业务校验
    businessValidator(_data) {
      return true
    },
  })
  // 请求前行为
  httpUtil.onBeforeFetchData(_config => {
  })
  // 请求出错行为
  httpUtil.onFetchDataError(error => {
    requestErrorMessage(error)
  })

  // 挂载全局FetchData
  window.FetchData = (c: AxiosRequestConfigExtend) =>
    httpUtil.FetchData.apply(httpUtil, [c]) as any
}


