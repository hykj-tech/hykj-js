---
name: hykj-use-toggle
description: "@hykj-js/vue3-hooks useCommonToggle: 布尔状态管理，open()/close()/toggle()，常用于dialog/drawer显隐控制"
---

# useCommonToggle — 布尔状态

```ts
import { useCommonToggle } from '@hykj-js/vue3-hooks'

const dialog = useCommonToggle()      // 初始 false
const drawer = useCommonToggle(true)  // 初始 true

dialog.open()          // value = true
dialog.close()         // value = false
dialog.toggle()        // 翻转
dialog.toggle(true)    // 强制设值
console.log(dialog.value)  // Ref<boolean>
```
