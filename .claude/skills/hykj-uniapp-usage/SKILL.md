---
name: hykj-uniapp-usage
description: 在 uniapp 工程使用 @hykj-js/uniapp（uni.request 的 axios 适配器、平台条件判断、文件下载/选择、storage、uniSafeToast）。当用户问"怎么在 uniapp 项目里用 hykj-js" 或集成 uni 平台工具时使用。
---

# `@hykj-js/uniapp` 使用指南

```bash
pnpm add @hykj-js/uniapp @hykj-js/shared axios qs
```

## 1. axios 适配器（关键）

uniapp 没有 XHR / fetch，必须用 `uni.request` / `uni.uploadFile`。本包提供适配器把 axios 请求转发到 uni API：

```ts
import { HttpUtil } from '@hykj-js/shared'
import { uniappAxiosAdapter } from '@hykj-js/uniapp'

const http = new HttpUtil({
  BASE_URL: 'https://api.example.com',
  adapter: uniappAxiosAdapter,
  statusValidator: (s) => s >= 200 && s < 300,
  businessValidator: (d) => d.code === 0,
})

const [data, err] = await http.FetchData({ url: '/user/me' })
```

之后在 uniapp 工程内任何使用 axios / `FetchData` 的代码都通过 uni 通道，无需改业务代码。

## 2. 平台条件判断

```ts
import { ifDefPlatform } from '@hykj-js/uniapp'
const platform = ifDefPlatform()
// 'h5' | 'weixin' | 'app' | 'app-plus' | 'mp-...'
```

> 注意：源码内部使用 uniapp 条件编译注释 `// #ifdef`，构建后由 `restoreUniappIfDef` 还原到产物 `index.js` 中，业务侧直接调用即可。

## 3. Storage（uni 同步存储封装）

```ts
import { setStorage, getStorage, removeStorage } from '@hykj-js/uniapp'
setStorage('token', 'xxx')
const t = getStorage<string>('token')
removeStorage('token')
```

## 4. 错误提示

```ts
import { requestErrorMessage, uniSafeToast } from '@hykj-js/uniapp'
const [data, err] = await FetchData(...)
if (err) requestErrorMessage(err)        // 自动 uni.showToast
uniSafeToast({ title: '保存成功', icon: 'success' })  // 已防抖防重叠
```

## 5. 文件能力

```ts
import { downloadFile, getStaticFile } from '@hykj-js/uniapp'

const localPath = await downloadFile('https://x/file.pdf')
const url = getStaticFile('static/img/logo.png')
```

## 6. 配置工具

`config/configUtil.ts` 提供基础 config 读写工具，结合 `platform.ts` 的 `ifDefPlatform` 可做按平台区分配置。

## 注意

- **必须**与 `@hykj-js/shared` 一起使用（`HttpUtil` 在 shared 中）
- uniapp 工程的 `manifest.json` / `pages.json` 不受本库影响
- 本库使用 dts 构建，自动注入 `AxiosRequestConfigExtend` 等全局类型，业务工程 `tsconfig.json` 需把 `node_modules/@hykj-js/uniapp/dist` 纳入扫描范围（默认即可）
