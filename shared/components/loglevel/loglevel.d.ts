// 扩展window._setLogLevel声明
// Path: hykj-js/shared/components/loglevel/index.ts

import log from 'loglevel'

declare global {
   const _setLogLevel: (level: log.LogLevelDesc)=>void
   const logger: log.Logger
}

export {};
