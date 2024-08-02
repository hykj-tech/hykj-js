import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
import { main } from './init'

import { initLogLevel, setDefaultLogLevel } from '@hykj-js/shared'
const isProd = import.meta.env.MODE === 'prod'
setDefaultLogLevel(isProd ? 'info' : 'trace')
initLogLevel()

const app = createApp(App)


await main(app)

app.mount('#app')
  
