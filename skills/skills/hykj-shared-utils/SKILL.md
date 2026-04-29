---
name: hykj-shared-utils
description: 使用 @hykj-js/shared 的基础工具：dayjs 初始化、loglevel 日志、storage 本地存储、common 工具函数（randomNum/delay/safeJSONParse 等）、ObjectResolver 批量去抖解析。当用户问怎么初始化 dayjs/日志/本地存储、需要工具函数、或批量翻译 id 时使用。
---

# @hykj-js/shared 基础工具

```bash
pnpm add @hykj-js/shared dayjs loglevel
```

## 1. dayjs 初始化

```ts
import { initDayjs } from '@hykj-js/shared'

// 应用入口调用一次
initDayjs()
```

效果：设置中文 locale + 默认 `format='YYYY-MM-DD HH:mm:ss'` + 挂载 `globalThis.dayjs`。

之后全局直接用 `dayjs()`，TypeScript 类型由 dist 自动提供。

## 2. loglevel 日志

```ts
import { initLogLevel, setDefaultLogLevel } from '@hykj-js/shared'

// 按环境设置日志级别
setDefaultLogLevel(import.meta.env.PROD ? 'info' : 'trace')

// 应用入口调用一次
initLogLevel()
```

效果：全局可用 `logger.trace()` / `logger.debug()` / `logger.info()` / `logger.warn()` / `logger.error()`，`_setLogLevel('debug')` 可运行时动态调级。

## 3. Storage（localStorage 序列化）

```ts
import { setStorage, getStorage, removeStorage } from '@hykj-js/shared'

setStorage('user', { id: 1, name: 'Alice' })     // 自动 JSON 序列化 + 类型标记
const u = getStorage<{ id: number; name: string }>('user')  // 自动反序列化
removeStorage('user')
```

内置序列化检测，读取时自动 `JSON.parse`，非 JSON 数据原样返回。

## 4. common 工具函数

```ts
import {
  randomNum, randomString, delay,
  findInTree, maskString,
  safeJSONParse, objectAssignByPick,
  polyfillStructuredClone, queryStringBuilder,
} from '@hykj-js/shared'
```

| 函数 | 说明 | 示例 |
|------|------|------|
| `randomNum(min, max)` | 随机整数 `[min, max]` | `randomNum(1, 100) → 42` |
| `randomString(len)` | 随机字母数字字符串 | `randomString(8) → 'aB3xK9mL'` |
| `delay(ms)` | Promise 延迟 | `await delay(500)` |
| `findInTree(tree, fn, opts?)` | 深度遍历树，返回匹配的首个节点 | `findInTree(tree, n => n.id === 'x')` |
| `maskString(str, head, tail)` | 字符串脱敏 | `maskString('13812345678', 3, 4) → '138****5678'` |
| `safeJSONParse(str, defaultVal)` | 安全 JSON 解析 | `safeJSONParse('{a:1}', {}) → {}` |
| `objectAssignByPick(target, ...srcs)` | 只复制 target 已有的 key | 批量赋值时避免引入多余字段 |
| `polyfillStructuredClone()` | 低版本环境 polyfill | `polyfillStructuredClone()` |
| `queryStringBuilder(obj)` | 构建 query string | `queryStringBuilder({ a:1, b:[2,3] }) → 'a=1&b=2&b=3'` |

## 5. ObjectResolver — 批量去抖解析

适用于列表中每行需要把 id 翻译成对象的场景。N 行并发调用会自动合并为一次批量请求（默认 5ms 去抖窗口）。

```ts
import { ObjectResolver } from '@hykj-js/shared'

const userResolver = new ObjectResolver<User>(
  async (ids) => {
    const [data] = await FetchData<User[]>({ url: '/user/batch', params: { ids } })
    return data!
  },
  {
    objectIdKey: 'id',       // 返回数组中匹配 id 的字段，默认 'id'
    timeout: 60_000,         // 缓存有效期 ms，默认 60000
    debounceTime: 5,         // 合并窗口 ms，默认 5
  }
)

// 在列表 formatter/computed 中调用
const users = await userResolver.resolveObjects(['1', '2', '3'])
// 返回 Map: { '1' => User, '2' => User, '3' => User }
```

工作原理：同一微任务（或 debounceTime 内）多次调用 `resolveObjects` 会被合并，去重后发起单次批量请求，结果缓存在内部 Map 中（按 id 索引），在 timeout 内重复访问直接返回缓存。
