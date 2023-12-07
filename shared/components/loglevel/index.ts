import log, {LogLevelDesc} from 'loglevel'
const logger = log
// 初始化日志级别
export const initLogLevel= ()=>{
  //@ts-ignore
  window._setLogLevel = setLogLevel
  window.logger = logger
}

// 设置日志级别
export const setLogLevel = (level: LogLevelDesc)=>{
  log.setLevel(level)
  const logLevelNameDict = ['trace', 'debug', 'info', 'warn', 'error']
  const levelNow = log.getLevel()
  console.info(`%c当前日志等级设置为: ${logLevelNameDict[levelNow]}`, 'color: #409EFF;')
  return levelNow
}

// 设置日志默认级别
export const setDefaultLogLevel = (level?: LogLevelDesc)=>{
  const targetLevel = level || 'info'
  log.setDefaultLevel(targetLevel)
  setLogLevel(targetLevel)
}
