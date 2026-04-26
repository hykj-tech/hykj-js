---
name: hykj-shared-usage
description: 在外部业务工程中使用 @hykj-js/shared 的核心能力（HttpUtil 元组式请求、aMap 加载、dayjs 初始化、loglevel、ObjectResolver 解析去抖、storage、common 工具）。当用户问"怎么用 @hykj-js/shared 的 xxx" 或集成 hykj-js 工具到新项目时使用。
---

# `@hykj-js/shared` 使用指南

```bash
pnpm add @hykj-js/shared axios dayjs lodash-es loglevel qs
```

> 这些是 peer / runtime 依赖，必须在宿主工程显式安装。

## 1. HttpUtil — 元组式 HTTP 请求

```ts
import { HttpUtil } from '@hykj-js/shared'

const http = new HttpUtil({
  BASE_URL: () => import.meta.env.VITE_API_BASE,
  requestTimeout: 30_000,
  statusValidator: (status) => status >= 200 && status < 300,
  businessValidator: (data) => data.code === 0,
  businessErrorMessageFields: ['msg', 'errmsg', 'message'],
})

http.onBeforeFetchData((config) => {
  config.headers.Authorization = `Bearer ${localStorage.token}`
})

http.onFetchDataError((err) => {
  if (err.isAbort) return
  if (err.isAfterSuccess) console.warn('业务错', err.message)
})

// 使用：返回 [data, error, response]
const [user, err] = await http.FetchData<UserDTO>({ url: '/user/me' })
if (err) return
console.log(user)

// 注入全局：
window.FetchData = (c) => http.FetchData.apply(http, [c])
```

`AxiosRequestConfigExtend` 扩展字段：`disableAutoMessage`、`disableAuthorization`、`ignoreStatusValidate`、`ignoreBusinessValidate`。

`HttpRequestError` 提供 `type`（`request|response|afterSuccess|callback`）、`isAbort`、`isTimeout`、`isAfterSuccess`、`requestUrl`、`response`、`config`。

## 2. dayjs

```ts
import { initDayjs } from '@hykj-js/shared'
initDayjs() // 设置中文 locale + 默认 format='YYYY-MM-DD HH:mm:ss' + 挂 globalThis.dayjs
```

## 3. loglevel

```ts
import { initLogLevel, setDefaultLogLevel } from '@hykj-js/shared'
setDefaultLogLevel(import.meta.env.PROD ? 'info' : 'trace')
initLogLevel() // 全局可用 logger / _setLogLevel
```

## 4. 高德地图

```ts
import { initAMapConfig, loadAmapJSAPI, getAMapJSCodeDevServerProxy } from '@hykj-js/shared'

// 应用启动时
initAMapConfig('JSAPI_KEY', 'WEB_KEY')
await loadAmapJSAPI({ plugins: ['AMap.Geocoder'] })

// vite.config.ts
server: { proxy: getAMapJSCodeDevServerProxy('YOUR_JSCODE') }
```

## 5. ObjectResolver — 批量去抖解析

适用于"列表中显示 N 条数据，每行需要把 id 翻译成 obj"的场景。自动 5ms 去抖合并请求。

```ts
import { ObjectResolver } from '@hykj-js/shared'

const userResolver = new ObjectResolver<User>(
  async (ids) => (await http.FetchData<User[]>({ url: '/user/batch', params: { ids } }))[0]!,
  { objectIdKey: 'id', timeout: 60_000, debounceTime: 5 }
)

const users = await userResolver.resolveObjects(['1', '2'])
```

## 6. Storage（localStorage 序列化）

```ts
import { setStorage, getStorage, removeStorage } from '@hykj-js/shared'
setStorage('user', { id: 1 })       // 自动序列化 + 类型标记
const u = getStorage<{id:number}>('user')
```

## 7. common 工具

`randomNum` / `randomString` / `delay(ms)` / `findInTree(tree, fn)` / `maskString` / `safeJSONParse` / `objectAssignByPick(target, ...sources)` / `polyfillStructuredClone()` / `queryStringBuilder(params)`。

## 注意

- 全局类型扩展（如 `window.FetchData`、`logger`、`dayjs`）通过 `dist/index.d.ts` 自动 re-export，不需要单独 import 类型文件
- `HttpUtil` 不内置任何 UI 提示；UI 提示由调用方（如 `@hykj-js/vue3-element-plus` 的 `requestErrorMessage`）实现
