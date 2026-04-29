---
name: hykj-request-error
description: "@hykj-js/vue3-element-plus requestErrorMessage(err): 将HttpRequestError转ElMessage错误提示，配合HttpUtil FetchData元组调用"
---

# requestErrorMessage — 统一错误提示

```ts
import { requestErrorMessage } from '@hykj-js/vue3-element-plus'

// 配合 HttpUtil FetchData 元组
const [data, err] = await FetchData({ url: '/order/submit', method: 'post', data: form })
if (err) {
  requestErrorMessage(err)   // 自动提取 message 并 ElMessage.error(...)
  return
}
```

接收 `HttpRequestError`（来自 `@hykj-js/shared`），自动处理 `isAbort`（取消请求不提示）、业务错误、网络错误等场景。
