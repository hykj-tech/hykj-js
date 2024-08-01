import {App} from 'vue-demi'
import { TestCp } from './components/testCp'
import {BaseTable} from './components/baseTable'
import {UploadAny} from "./components/uploadAny";
import {DictInput} from "./components/dictInput";

// 所有vue组件列表
const components = [
    TestCp,
    BaseTable,
    UploadAny,
    DictInput
]

export const installer = (app: App) => {
  components.forEach((comp) => app.use(comp))
}
