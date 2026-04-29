---
name: hykj-common-utils
description: "@hykj-js/shared common工具函数: randomNum/randomString/delay/findInTree/maskString/safeJSONParse/objectAssignByPick/polyfillStructuredClone/queryStringBuilder"
---

# common 工具函数

```ts
import {
  randomNum, randomString, delay,
  findInTree, maskString,
  safeJSONParse, objectAssignByPick,
  polyfillStructuredClone, queryStringBuilder,
} from '@hykj-js/shared'

randomNum(1, 100)                       // 随机整数 [1,100]
randomString(8)                         // 随机字母数字字符串
await delay(500)                        // Promise 延迟 500ms

findInTree(tree, (node) => node.id === target)  // 深度遍历树节点

maskString('13812345678', 3, 4)         // '138****5678'

safeJSONParse('{"a":1}', {})           // 解析失败返回默认值

objectAssignByPick(target, source1, source2)  // 只复制 target 已有的 key

polyfillStructuredClone()              // 低版本环境 polyfill

queryStringBuilder({ a: 1, b: [2, 3] })  // 'a=1&b=2&b=3'
```
