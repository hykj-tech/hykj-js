---
name: hykj-uniapp
description: 在 uniapp 工程中使用 @hykj-js/uniapp 的全部能力：axios 适配器（uni.request 转发）、平台条件判断、文件下载/路径、storage 同步存储、错误提示/toast。当用户问"怎么在 uniapp 项目里用 hykj-js"或需要 uni 平台工具时使用。
---

# @hykj-js/uniapp 使用指南

```bash
pnpm add @hykj-js/uniapp @hykj-js/shared axios qs
```

## 1. HTTP 适配器（核心）

uniapp 无 XHR/fetch，必须使用 `uniappAxiosAdapter` 将 axios 请求转发到 `uni.request` / `uni.uploadFile`。

```ts
import { HttpUtil } from '@hykj-js/shared'
import { uniappAxiosAdapter } from '@hykj-js/uniapp'

const http = new HttpUtil({
  BASE_URL: 'https://api.example.com',
  adapter: uniappAxiosAdapter,          // 关键：注入 uni 适配器
  statusValidator: (s) => s >= 200 && s < 300,
  businessValidator: (d) => d.code === 0,
  businessErrorMessageFields: ['msg', 'message'],
})

// 注入全局
window.FetchData = (c) => http.FetchData.apply(http, [c])

// 使用方式与浏览器端完全一致
const [data, err] = await http.FetchData({ url: '/user/me' })
```

配置后所有 `FetchData` 调用自动走 uni 通道，业务代码无需平台判断。

## 2. 平台条件判断

```ts
import { ifDefPlatform } from '@hykj-js/uniapp'

const platform = ifDefPlatform()
// 返回值: 'h5' | 'weixin' | 'app' | 'app-plus' | 'mp-weixin' | 'mp-alipay' | ...
```

源码使用 uniapp `// #ifdef` 条件编译注释，构建时自动还原，业务侧直接调用即可。

## 3. 文件工具

```ts
import { downloadFile, getStaticFile } from '@hykj-js/uniapp'

// 下载远程文件到本地临时路径（返回 localPath）
const localPath = await downloadFile('https://example.com/file.pdf')

// 获取 static 目录资源的绝对路径
const logoUrl = getStaticFile('static/img/logo.png')
```

## 4. Storage（uni 同步存储）

```ts
import { setStorage, getStorage, removeStorage } from '@hykj-js/uniapp'

setStorage('token', 'xxx')
const t = getStorage<string>('token')
removeStorage('token')
```

底层调用 `uni.setStorageSync` / `uni.getStorageSync`，自动 JSON 序列化/反序列化。

## 5. 错误提示 / Toast

```ts
import { requestErrorMessage, uniSafeToast } from '@hykj-js/uniapp'

// 配合 FetchData 元组使用
const [data, err] = await FetchData({ url: '/order/list' })
if (err) {
  requestErrorMessage(err)   // 从 HttpRequestError 提取 message 并 uni.showToast
  return
}

// 通用 toast（内置防抖防重叠）
uniSafeToast({ title: '保存成功', icon: 'success' })
uniSafeToast({ title: '操作失败', icon: 'error' })
```

`requestErrorMessage` 会自动处理 `isAbort`（取消不提示）、业务错误、网络错误等场景。

## 完整初始化示例

```ts
// utils/http.ts
import { HttpUtil } from '@hykj-js/shared'
import { uniappAxiosAdapter } from '@hykj-js/uniapp'

export const http = new HttpUtil({
  BASE_URL: 'https://api.example.com',
  adapter: uniappAxiosAdapter,
  statusValidator: (s) => s >= 200 && s < 300,
  businessValidator: (d) => d.code === 0,
  businessErrorMessageFields: ['msg', 'message'],
})

http.onBeforeFetchData((config) => {
  const token = uni.getStorageSync('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
})

import { requestErrorMessage } from '@hykj-js/uniapp'
http.onFetchDataError((err) => {
  if (err.isAbort) return
  requestErrorMessage(err)
})

window.FetchData = (c) => http.FetchData.apply(http, [c])
```
