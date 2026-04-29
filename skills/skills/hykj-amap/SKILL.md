---
name: hykj-amap
description: "@hykj-js/shared 高德地图: initAMapConfig初始化key、loadAmapJSAPI异步加载SDK、getAMapJSCodeDevServerProxy生成vite代理配置"
---

# 高德地图

```bash
pnpm add @hykj-js/shared
```

## 初始化 + 加载 SDK

```ts
import { initAMapConfig, loadAmapJSAPI } from '@hykj-js/shared'

// 应用启动时
initAMapConfig('JSAPI_KEY', 'WEB_KEY')
await loadAmapJSAPI({ plugins: ['AMap.Geocoder', 'AMap.AutoComplete'] })
// 之后 window.AMap 可用
```

## vite.config.ts 开发代理

```ts
import { getAMapJSCodeDevServerProxy } from '@hykj-js/shared'

export default {
  server: {
    proxy: getAMapJSCodeDevServerProxy('YOUR_SECURITY_JSCODE'),
  },
}
```

全局类型 `Window.aMapConfig` 由 `dist/index.d.ts` 自动提供。
