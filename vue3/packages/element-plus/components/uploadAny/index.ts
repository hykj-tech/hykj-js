import { withInstall } from '../../utils/install'

import CP from './uploadAny.vue'

export const UploadAny = withInstall(CP)

export default UploadAny

export * from './utils'
export * from './type'
export {onBeforeNormalUpload} from './configUpload'
export type { BeforeNormalUploadFunc, BeforeNormalUploadPayload} from './configUpload'
