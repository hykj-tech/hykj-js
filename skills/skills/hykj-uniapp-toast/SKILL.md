---
name: hykj-uniapp-toast
description: "@hykj-js/uniapp 错误提示: requestErrorMessage(err)将HttpRequestError转uni.showToast、uniSafeToast防抖防重叠toast"
---

# uniapp 错误提示 / Toast

```ts
import { requestErrorMessage, uniSafeToast } from '@hykj-js/uniapp'

// 配合 HttpUtil FetchData 使用
const [data, err] = await FetchData({ url: '/order/list' })
if (err) {
  requestErrorMessage(err)   // 自动从 HttpRequestError 提取 message 并 uni.showToast
  return
}

// 通用 toast（内置防抖、防重叠）
uniSafeToast({ title: '保存成功', icon: 'success' })
uniSafeToast({ title: '操作失败', icon: 'error' })
```
