---
name: hykj-http
description: 在业务工程中配置和使用 @hykj-js/shared 的 HttpUtil 元组式 HTTP 请求。当用户需要发请求、配置拦截器、处理错误、或问"怎么请求后端"时使用。
---

# HttpUtil — 元组式 HTTP 请求

`HttpUtil` 是 @hykj-js 中最核心的模块，封装了 axios，提供 `[data, error, response]` 元组返回模式，让上层代码无需 try/catch。

```bash
pnpm add @hykj-js/shared axios qs
```

## 实例化配置

```ts
import { HttpUtil } from '@hykj-js/shared'

const http = new HttpUtil({
  BASE_URL: () => import.meta.env.VITE_API_BASE,  // 支持函数，每次请求动态取值
  requestTimeout: 30_000,
  statusValidator: (status) => status >= 200 && status < 300,
  businessValidator: (data) => data.code === 0,
  businessErrorMessageFields: ['msg', 'errmsg', 'message'],
})
```

### HttpUtilConfig 全部字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `BASE_URL` | `string \| () => string` | 基础路径，支持函数动态取值（常用于环境变量） |
| `requestTimeout` | `number` | 超时毫秒，默认 5 分钟 |
| `statusValidator` | `(status: number) => boolean` | HTTP 状态码校验，默认 200-299 |
| `businessValidator` | `(data: any) => boolean` | 业务数据校验，如 `data.code === 0` |
| `businessErrorMessageFields` | `string[]` | 从响应 data 中提取错误消息的字段名，依次尝试 |
| `adapter` | `(config) => Promise<any>` | 自定义请求适配器（如 uniapp 的 `uniappAxiosAdapter`） |

## 拦截器

```ts
// 请求前置：注入 token、修改参数等
http.onBeforeFetchData((config) => {
  config.headers.Authorization = `Bearer ${localStorage.token}`
})

// 请求后置：统一处理响应
http.onAfterFetchData((response) => {
  // 例如刷新 token
})

// 错误处理：统一错误提示、日志上报
http.onFetchDataError((err) => {
  if (err.isAbort) return           // 取消的请求不提示
  if (err.isTimeout) console.warn('超时')
  if (err.isAfterSuccess) console.warn('业务错误', err.message)
})
```

每个拦截器类型都支持注册多个回调，按注册顺序依次执行。

## 调用 — 返回 `[data, error, response]`

```ts
// 查询
const [user, err] = await http.FetchData<UserDTO>({ url: '/user/me' })
if (err) return
console.log(user)

// 提交（POST）
const [, err2] = await http.FetchData({
  url: '/order/submit',
  method: 'post',
  data: { amount: 100 },
})
if (err2) return
// 成功

// 注入全局（推荐，之后业务代码直接调 window.FetchData）
window.FetchData = (c) => http.FetchData.apply(http, [c])
```

> `FetchData` 泛型只影响 `data` 的类型，`error` 始终是 `HttpRequestError | null`。

## AxiosRequestConfigExtend 扩展字段

这些扩展字段在标准 axios config 之上提供精细控制：

| 字段 | 类型 | 作用 |
|------|------|------|
| `disableAutoMessage` | `boolean` | 不触发 `onFetchDataError` 回调（静默请求） |
| `disableAuthorization` | `boolean` | 跳过 `onBeforeFetchData` 中注入 token 的逻辑 |
| `ignoreStatusValidate` | `boolean` | 跳过 HTTP 状态码校验 |
| `ignoreBusinessValidate` | `boolean` | 跳过业务校验（如需要原始错误响应） |

```ts
// 静默请求，不触发全局错误提示
const [data] = await http.FetchData({
  url: '/heartbeat',
  disableAutoMessage: true,
})
```

## HttpRequestError

错误对象提供了丰富的上下文信息，方便按场景处理：

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `'request' \| 'response' \| 'afterSuccess' \| 'callback'` | 错误阶段 |
| `message` | `string` | 错误描述 |
| `requestUrl` | `string` | 完整的请求 URL（含参数） |
| `isAbort` | `boolean` | 是否为取消的请求 |
| `isTimeout` | `boolean` | 是否为超时 |
| `isAfterSuccess` | `boolean` | 是否为业务错误（HTTP 成功但业务 code ≠ 0） |
| `config` | `AxiosRequestConfigExtend` | 请求配置 |
| `response` | `AxiosResponse` | 响应对象（如有） |

`type` 的四种阶段：
- `request` — 请求未发出（网络不通、浏览器拦截等）
- `response` — 请求发出但无响应（超时、服务器无响应）
- `afterSuccess` — HTTP 成功但业务校验未通过（业务 code 错误）
- `callback` — 拦截器回调中抛出的错误

## 完整初始化示例

```ts
// utils/http.ts
import { HttpUtil } from '@hykj-js/shared'

export const http = new HttpUtil({
  BASE_URL: () => import.meta.env.VITE_API_BASE,
  requestTimeout: 30_000,
  statusValidator: (status) => status >= 200 && status < 300,
  businessValidator: (data) => data.code === 0,
  businessErrorMessageFields: ['msg', 'errmsg', 'message'],
})

http.onBeforeFetchData((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
})

http.onFetchDataError((err) => {
  if (err.isAbort) return
  // 具体的 UI 提示由各平台的 requestErrorMessage 处理
  console.error(`[HTTP] ${err.type}: ${err.message}`, err.requestUrl)
})

// 注入全局
window.FetchData = (c) => http.FetchData.apply(http, [c])
```

启动时 import 该文件即可完成初始化。
