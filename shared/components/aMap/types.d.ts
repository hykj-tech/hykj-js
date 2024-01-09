import "@amap/amap-jsapi-types";

declare global {
  interface Window {
    // 供api加载使用
    aMapConfig:{
      key: string,
    },
    // 详见： https://lbs.amap.com/api/jsapi-v2/guide/abc/load
    _AMapSecurityConfig: {
      serviceHost: string
    }
  }
}

export {};
