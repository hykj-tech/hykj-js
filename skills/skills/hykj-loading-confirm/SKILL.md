---
name: hykj-loading-confirm
description: "@hykj-js/vue3-element-plus loadingConfirm: 异步确认对话框，confirm按钮loading状态直到异步操作完成，避免重复提交"
---

# loadingConfirm — 异步确认对话框

```ts
import { loadingConfirm } from '@hykj-js/vue3-element-plus'

await loadingConfirm(
  {
    title: '确认删除',
    message: '删除后不可恢复，是否继续？',
    loadingText: '删除中...',   // confirm 按钮 loading 时显示的文字
    confirmButtonText: '确认删除',
    type: 'warning',
  },
  async (action) => {
    if (action === 'confirm') {
      await FetchData({ url: `/record/${id}`, method: 'delete' })
    }
  },
)
```

`action` 为 `'confirm' | 'cancel'`。confirm 期间按钮 loading，异步完成后对话框关闭。
