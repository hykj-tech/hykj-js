---
name: hykj-uniapp-platform
description: "@hykj-js/uniapp ifDefPlatform(): 运行时判断当前uniapp平台，内部使用条件编译注释，返回'h5'|'weixin'|'app'|'mp-*'等"
---

# 平台条件判断

```ts
import { ifDefPlatform } from '@hykj-js/uniapp'

const platform = ifDefPlatform()
// 返回值: 'h5' | 'weixin' | 'app' | 'app-plus' | 'mp-weixin' | 'mp-alipay' | ...
```

源码使用 uniapp `// #ifdef` 条件编译注释，构建时由 `restoreUniappIfDef` 脚本还原到产物 `index.js`，业务侧直接调用即可，无需任何额外配置。
