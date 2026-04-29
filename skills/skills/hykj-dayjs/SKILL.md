---
name: hykj-dayjs
description: "@hykj-js/shared dayjs初始化: initDayjs()挂载globalThis.dayjs、中文locale、默认format YYYY-MM-DD HH:mm:ss"
---

# dayjs 初始化

```bash
pnpm add @hykj-js/shared dayjs
```

```ts
import { initDayjs } from '@hykj-js/shared'

// 应用入口调用一次
initDayjs()
// 效果：设置中文 locale + 默认 format='YYYY-MM-DD HH:mm:ss' + 挂 globalThis.dayjs
```

之后全局可直接用 `dayjs()`，TypeScript 全局类型由 `@hykj-js/shared/dist/index.d.ts` 自动提供，无需单独 import 类型。
