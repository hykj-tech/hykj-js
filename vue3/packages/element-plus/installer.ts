import {App} from 'vue-demi'
import {BaseTable} from './components/baseTable'
import {UploadAny} from "./components/uploadAny";
import {DictInput} from "./components/dictInput";

// 所有vue组件列表
const components = [
    BaseTable,
    UploadAny,
    DictInput
]

export const installer = (app: App) => {
  components.forEach((comp) => app.use(comp))
}
