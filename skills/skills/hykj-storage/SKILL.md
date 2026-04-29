---
name: hykj-storage
description: "@hykj-js/shared localStorage封装: setStorage/getStorage/removeStorage自动JSON序列化+类型标记，浏览器端使用"
---

# Storage（浏览器 localStorage）

```ts
import { setStorage, getStorage, removeStorage } from '@hykj-js/shared'

setStorage('user', { id: 1, name: 'Alice' })   // 自动序列化 + 类型标记
const u = getStorage<{ id: number; name: string }>('user')  // 自动反序列化
removeStorage('user')
```
