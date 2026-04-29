---
name: hykj-uniapp-storage
description: "@hykj-js/uniapp storage: setStorage/getStorage/removeStorage封装uni.setStorageSync，自动JSON序列化，uniapp同步存储"
---

# uniapp Storage

```ts
import { setStorage, getStorage, removeStorage } from '@hykj-js/uniapp'

setStorage('token', 'xxx')
const t = getStorage<string>('token')
removeStorage('token')
```

底层调用 `uni.setStorageSync` / `uni.getStorageSync`，自动 JSON 序列化/反序列化。
