import {App} from 'vue'
import { TestCp } from './components/testCp'
import {BaseTable} from './components/baseTable'
const elmPlusComponents = [
    TestCp,
    BaseTable
]

export const installer = (app: App) => {
  elmPlusComponents.forEach((comp) => app.use(comp))
}
