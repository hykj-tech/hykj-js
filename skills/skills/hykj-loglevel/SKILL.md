---
name: hykj-loglevel
description: "@hykj-js/shared loglevel初始化: initLogLevel()挂载全局logger/_setLogLevel、setDefaultLogLevel按环境设级别"
---

# loglevel 初始化

```bash
pnpm add @hykj-js/shared loglevel
```

```ts
import { initLogLevel, setDefaultLogLevel } from '@hykj-js/shared'

setDefaultLogLevel(import.meta.env.PROD ? 'info' : 'trace')
initLogLevel()
// 效果：全局可用 logger.info/warn/error，_setLogLevel() 动态调级
```

全局类型由 `dist/index.d.ts` 自动提供。
