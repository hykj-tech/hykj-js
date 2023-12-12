import {App} from 'vue'
import { TestCp } from './components/testCp'
import {BaseTable} from './components/baseTable'
import {UploadAny} from "./components/uploadAny";
import {DictInput} from "./components/dictInput";

const elmPlusComponents = [
    TestCp,
    BaseTable,
    UploadAny,
    DictInput
]

export const installer = (app: App) => {
  elmPlusComponents.forEach((comp) => app.use(comp))
}
