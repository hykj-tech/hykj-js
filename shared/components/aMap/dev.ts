/**
 * 生成前端devServer使用的代理配置
 */
export const getAMapJSCodeDevServerProxy = (jsCode: string)=>{
  return {
    // 高德地图jscode代理
    '/_AMapService':{
      target: 'https://restapi.amap.com/',
      changeOrigin: true,
      rewrite: (path)=>{
        // 详见： https://lbs.amap.com/api/jsapi-v2/guide/abc/load
        // @ts-ignore
        return (path + `&jscode=${jsCode}`).replace('/_AMapService', '')
      }
    }
  }
}


