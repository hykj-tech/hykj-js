export type StaticFileOptions = {
  remote?: boolean;
  prefix?: string;
  remoteUrl?: string;
}

// 支持实时方法，以便可以动态修改配置
type remoteUrlFn = () => string

/**
 * 静态文件工具类，用于处理静态文件的路径，抽象获取文件路径的逻辑，方便切换远程和本地文件
 */
export class StaticFileUtil{
  // 本地文件夹的前缀
  private localStaticPathPrefix: string = '/static/'
  // 是否默认启用远程文件
  private defaultUseRemote: boolean = false
  private remoteUrl: string | remoteUrlFn 
  constructor(StaticFileConfig: {localStaticPathPrefix?: string, defaultUseRemote?: boolean, remoteUrl?:string | remoteUrlFn}) {
    if (StaticFileConfig.localStaticPathPrefix) {
      this.localStaticPathPrefix = StaticFileConfig.localStaticPathPrefix
    }
    if(StaticFileConfig.defaultUseRemote !== undefined){
      this.defaultUseRemote = StaticFileConfig.defaultUseRemote
    }
    if(StaticFileConfig.remoteUrl){
      this.remoteUrl = StaticFileConfig.remoteUrl
    }
  }
  public staticFile(url: string, options?: StaticFileOptions) {
    if(url.startsWith('http')){
      return url
    }
    const useRemote = options?.remote !== undefined ? options.remote : this.defaultUseRemote
    const prefix = options?.prefix !== undefined ? options.prefix : this.localStaticPathPrefix
    if(useRemote){
      const remoteUrl = options?.remoteUrl 
      || (this.remoteUrl instanceof Function ? this.remoteUrl() : this.remoteUrl)
      const date = new Date()
      const yyyy = date.getFullYear()
      const mm = date.getMonth() + 1
      const dd = date.getDate()
      const hh = date.getHours()
      const MM = date.getMinutes()
      return `${remoteUrl}${url}?time=${yyyy}${mm}${dd}${hh}${MM}`
    }
    return `${prefix}${url}`
  }
}
