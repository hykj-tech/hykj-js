---
name: hykj-http
description: "@hykj-js/shared HttpUtil: 实例化配置、FetchData元组调用[data,err,res]、拦截器onBeforeFetchData/onFetchDataError、AxiosRequestConfigExtend扩展字段、HttpRequestError类型"
---

# HttpUtil — 元组式 HTTP 请求

```bash
pnpm add @hykj-js/shared axios qs
```

## 实例化

```ts
import { HttpUtil } from '@hykj-js/shared'

const http = new HttpUtil({
  BASE_URL: () => import.meta.env.VITE_API_BASE,
  requestTimeout: 30_000,
  statusValidator: (status) => status >= 200 && status < 300,
  businessValidator: (data) => data.code === 0,
  businessErrorMessageFields: ['msg', 'errmsg', 'message'],
})
```

## 拦截器

```ts
http.onBeforeFetchData((config) => {
  config.headers.Authorization = `Bearer ${localStorage.token}`
})

http.onFetchDataError((err) => {
  if (err.isAbort) return
  if (err.isAfterSuccess) console.warn('业务错误', err.message)
})
```

## 调用 — 返回 `[data, error, response]`

```ts
const [user, err] = await http.FetchData<UserDTO>({ url: '/user/me' })
if (err) return
console.log(user)

// 注入全局 window.FetchData
window.FetchData = (c) => http.FetchData.apply(http, [c])
```

## AxiosRequestConfigExtend 扩展字段

| 字段 | 作用 |
|------|------|
| `disableAutoMessage` | 不触发 onFetchDataError |
| `disableAuthorization` | 跳过 onBeforeFetchData 的 token 注入 |
| `ignoreStatusValidate` | 跳过 statusValidator |
| `ignoreBusinessValidate` | 跳过 businessValidator |

## HttpRequestError 字段

`type`（`request|response|afterSuccess|callback`）、`isAbort`、`isTimeout`、`isAfterSuccess`、`requestUrl`、`response`、`config`、`message`
