import "@amap/amap-jsapi-types";

export const initAMapConfig = (jsAPIKey: string ,webKey: string)=>{
  // @ts-ignore
  // 储存JSAPI、WEBAPI的key
  window.aMapConfig = {
    key: jsAPIKey,
    webKey: webKey,
  }
  // 储存服务地址代理配置
  const protocol = window.location.protocol;
  const host = window.location.host;
  window._AMapSecurityConfig = {
    serviceHost: `${protocol}//${host}/_AMapService`,
  }
}

export type LoadAmapJSAPIOptions = {
  // key: string; // 申请好的Web端开发者Key，首次调用 load 时必填
  version?: string; // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
  plugins?: string[]; //插件列表
  // 是否加载 AMapUI，缺省不加载
  AMapUI?: {
    version?: string; // AMapUI 缺省 1.1
    plugins?: string[]; // 需要加载的 AMapUI ui插件
  };
  // 是否加载 Loca， 缺省不加载
  Loca?: {
    version?: string; // Loca 版本，缺省 1.3.2
  };
}

/**
 * 这个方法全局只需要调用一次，就可以将Amap对象挂载到window上
 * @param options
 */
export async function loadAmapJSAPI(options?: LoadAmapJSAPIOptions) {
  await new Promise(ok => {
    // '@amap/amap-jsapi-loader' 这个包是要求浏览器才有的，uniapp引入会报错，所以这里需要动态import
    import('@amap/amap-jsapi-loader').then(async (AMapLoader) => {
      // reset会清除掉window.AMap对象，重新加载
      (AMapLoader as any).reset()
      await AMapLoader.load({
        key: window.aMapConfig?.key,             // 申请好的Web端开发者Key，首次调用 load 时必填
        // 一定使用1.4.15，不能用新版2.0
        version: options?.version || '1.4.15',      // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
        plugins: options?.plugins || [],
        AMapUI: options?.AMapUI || undefined,
        Loca: options?.Loca || undefined,
      })
      ok(null)
    });
  })
}

export * from './dev'
