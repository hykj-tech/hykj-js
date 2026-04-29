---
name: hykj-element-plus-utils
description: 使用 @hykj-js/vue3-element-plus 的辅助功能（UploadAny 上传、loadingConfirm 确认对话框、requestErrorMessage 错误提示、mediaFilePreview 媒体预览）以及 @hykj-js/vue3-hooks 的简单 hook（useCommonToggle 布尔状态、useResettableState/Ref 可重置状态）。当用户需要上传文件、确认对话框、媒体预览、错误提示、toggle 开关、表单重置时使用。
---

# Element Plus 辅助功能 + Vue3 基础 Hooks

```bash
pnpm add @hykj-js/vue3-element-plus @hykj-js/vue3-hooks @hykj-js/shared element-plus vue
```

## 1. UploadAny — 通用上传

```vue
<script setup lang="ts">
import { UploadAny, onBeforeNormalUpload } from '@hykj-js/vue3-element-plus'

// 全局配置（main.ts 或应用初始化时调用一次）
onBeforeNormalUpload((payload) => {
  payload.url = '/file/upload'
  payload.method = 'post'
  if (payload.file?.raw) {
    payload.formData.append('file', payload.file.raw)
  }
})

const fileList = ref([])
</script>

<template>
  <UploadAny
    v-model="fileList"
    :limit="5"
    accept="image/*,.pdf,.docx"
    :multiple="true"
  />
</template>
```

`payload` 字段：`url`（必填）、`method`、`formData`（FormData 实例）、`headers`、`file`（ElUploadFile）。

`v-model` 值为 `{ url: string; name: string; ... }[]`，上传成功后自动追加。

> UploadAny 内部会以默认配置创建 HttpUtil 实例并注入 `window.FetchData` 兜底。如果业务侧已初始化，业务侧那份生效。

## 2. loadingConfirm — 异步确认对话框

confirm 按钮在异步操作完成前保持 loading 状态，防止重复提交。

```ts
import { loadingConfirm } from '@hykj-js/vue3-element-plus'

await loadingConfirm(
  {
    title: '确认删除',
    message: '删除后不可恢复，是否继续？',
    loadingText: '删除中...',
    confirmButtonText: '确认删除',
    type: 'warning',
  },
  async (action) => {
    if (action === 'confirm') {
      await FetchData({ url: `/record/${id}`, method: 'delete' })
    }
    // action === 'cancel' 时不做任何操作，对话框自动关闭
  },
)
```

配置项：`title`、`message`、`loadingText`（loading 时按钮文字）、`confirmButtonText`、`cancelButtonText`、`type`（`'warning'|'danger'|...`）、`html`（message 是否支持 HTML）。

## 3. requestErrorMessage — 统一错误提示

将 `HttpRequestError` 转为 `ElMessage.error()`，配合 `HttpUtil.FetchData` 元组调用。

```ts
import { requestErrorMessage } from '@hykj-js/vue3-element-plus'

const [data, err] = await FetchData({ url: '/order/submit', method: 'post', data: form })
if (err) {
  requestErrorMessage(err)   // 自动提取 message 并 ElMessage.error(...)
  return
}
```

自动处理：`isAbort`（取消请求不提示）、业务错误、网络错误。

## 4. mediaFilePreview — 函数式媒体预览

函数调用弹出预览对话框，支持图片/视频/PDF。

```ts
import { mediaFilePreview } from '@hykj-js/vue3-element-plus'

// 图片预览（自动推断类型）
mediaFilePreview('https://example.com/photo.jpg')

// 视频预览
mediaFilePreview('https://example.com/video.mp4', { previewType: 'video' })

// PDF 在新窗口打开
mediaFilePreview('https://example.com/doc.pdf', { useWindowOpen: true })

// PDF 在对话框内嵌预览
mediaFilePreview('https://example.com/doc.pdf', { previewType: 'pdf' })
```

| 选项 | 类型 | 说明 |
|------|------|------|
| `previewType` | `'image' \| 'video' \| 'pdf'` | 预览类型，默认按文件扩展名推断 |
| `useWindowOpen` | `boolean` | `true` 时直接 `window.open(url)`，不弹对话框 |

---

## 5. useCommonToggle — 布尔状态

常用于 dialog / drawer 的显隐控制。

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

## 6. useResettableState / useResettableRef — 可重置状态

适用于表单场景，需要"重置到初始值"的能力。

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

`useResettableState` 仅接受对象类型（内部通过 `reactive` 实现），初始值深拷贝后作为 reset 基准。
