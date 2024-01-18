import { withInstall } from '../../utils/install'

import CP from './uploadAny.vue'
import {HttpUtil} from "@hykj-js/shared";

export const UploadAny = withInstall(CP)

export default UploadAny

export * from './utils'
export * from './type'
export {onBeforeNormalUpload} from './configUpload'
export type { BeforeNormalUploadFunc, BeforeNormalUploadPayload} from './configUpload'

// 兜底生成httpUtil
const httpUtil = new HttpUtil()
window.FetchData = (c)=> httpUtil.FetchData.apply(httpUtil,[c])
