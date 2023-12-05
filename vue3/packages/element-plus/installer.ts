import {App} from 'vue'
import { TestCp } from './components/testCp'

const elmPlusComponents = [
    TestCp,
]

export const installer = (app: App) => {
  elmPlusComponents.forEach((comp) => app.use(comp))
}
