---
name: hykj-use-resettable
description: "@hykj-js/vue3-hooks useResettableState/useResettableRef: 带reset的响应式状态，返回[state, reset]，对象用State非对象用Ref"
---

# useResettableState / useResettableRef

```ts
import { useResettableState, useResettableRef } from '@hykj-js/vue3-hooks'

// 对象类型用 State（返回 reactive 对象）
const [form, resetForm] = useResettableState({ name: '', age: 0, tags: [] as string[] })
form.name = 'Alice'
form.age = 25
resetForm()  // 回到 { name: '', age: 0, tags: [] }

// 非对象类型用 Ref（返回 Ref）
const [count, resetCount] = useResettableRef(0)
count.value++
resetCount()  // 回到 0
```

`useResettableState` 仅接受对象类型，初始值深拷贝后作为 reset 基准。
