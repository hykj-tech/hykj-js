import {App} from 'vue'
import { TestCP } from './components/testCp'

const elmPlusComponents = [
    TestCP,
]

export const installer = (app: App) => {
  elmPlusComponents.forEach((comp) => app.use(comp))
}