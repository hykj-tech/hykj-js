---
name: hykj-uniapp-http
description: "@hykj-js/uniapp uniappAxiosAdapter: 将HttpUtil请求通过uni.request/uploadFile转发，替换浏览器XHR，uniapp工程必须配置"
---

# uniapp HTTP 适配器

```bash
pnpm add @hykj-js/uniapp @hykj-js/shared axios qs
```

uniapp 无 XHR/fetch，必须用此适配器将 axios 请求转发到 `uni.request` / `uni.uploadFile`。

```ts
import { HttpUtil } from '@hykj-js/shared'
import { uniappAxiosAdapter } from '@hykj-js/uniapp'

const http = new HttpUtil({
  BASE_URL: 'https://api.example.com',
  adapter: uniappAxiosAdapter,          // 关键：注入适配器
  statusValidator: (s) => s >= 200 && s < 300,
  businessValidator: (d) => d.code === 0,
  businessErrorMessageFields: ['msg', 'message'],
})

// 注入全局
window.FetchData = (c) => http.FetchData.apply(http, [c])

// 使用（与浏览器端完全一致）
const [data, err] = await http.FetchData({ url: '/user/me' })
```

配置后所有 `FetchData` 调用自动走 uni 通道，业务代码无需修改。
