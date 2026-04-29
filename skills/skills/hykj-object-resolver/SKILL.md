---
name: hykj-object-resolver
description: "@hykj-js/shared ObjectResolver: 批量ID转对象，自动5ms去抖合并请求，适合列表行内id翻译场景"
---

# ObjectResolver — 批量去抖解析

适用于列表中 N 行各自把 id 翻译成对象，自动合并同批次请求（默认 5ms 去抖）。

```ts
import { ObjectResolver } from '@hykj-js/shared'

const userResolver = new ObjectResolver<User>(
  async (ids) => {
    const [data] = await FetchData<User[]>({ url: '/user/batch', params: { ids } })
    return data!
  },
  {
    objectIdKey: 'id',       // 返回数组中用哪个字段匹配 id，默认 'id'
    timeout: 60_000,         // 缓存有效期 ms
    debounceTime: 5,         // 合并窗口 ms
  }
)

// 在列表的 formatter/computed 中调用，多行并发调用会被自动合并为一次请求
const users = await userResolver.resolveObjects(['1', '2', '3'])
```
