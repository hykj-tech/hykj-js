// 这个模块全局嵌入一个CONFIG对象，用于uniapp配置全局参数
import { Platform, platformIsBrowser } from './platform'

// 全局配置对象，每一个模式对应一个类型
export type Config<ExtendType = Record<string, any>> = {
  // 主后端服务地址
  backendUrl: string
  // 主远程静态文件服务地址
  remoteStaticUrl: string
  // 是否是浏览器环境
  isBrowser: boolean
  // 当前平台类型
  platform: string
  // 当前是否是开发模式
  isDev: boolean
} & ExtendType

const emptyConfig: Config = {
  backendUrl: '',
  remoteStaticUrl: '',
  isBrowser: false,
  platform: '',
  isDev: false,
}
export class ConfigUtil {
  // 所有模式的配置
  private ConfigList: Record<string, Config>
  constructor() {
    this.ConfigList = {}
  }
  // 注册配置，提供一个modeKey， 一个配置对象
  public registerConfig(modeKey: string, config: Partial<Config>) {
    this.ConfigList[modeKey] = Object.assign({},emptyConfig, config)
  }
  // 获取配置，并安装应用到全局, 这里需要使用者自行定义扩展，因为xtendType需要指定
  public installConfig(modeKey: string, overrideConfig?: Partial<Config>) {
    const config = this.ConfigList[modeKey]
    // 根据当前platform，判断isBrowser和platform
    config.isBrowser = platformIsBrowser
    config.platform = Platform
    if (!config) {
      throw new Error(`未找到${modeKey}对应的配置`)
    }
    // 合并配置
    ;(globalThis as any).CONFIG = Object.assign({}, config, overrideConfig || {})
  }
  // 指定配置key列表，用于生成local文件，内容就是按照es6语法export default {} 生成
  static makeConfigTemplateString(config: Partial<Config>) {
    // 这里不使用JSON.stringify，因为JSON.stringify会把key加上双引号，这里按照一行一行保持两个空格缩紧输出
    let str = `export default {\n`
    for (const key in config) {
      str += `  ${key}: ${JSON.stringify(config[key])},\n`
    }
    str += `}`
    return str
  }
}
