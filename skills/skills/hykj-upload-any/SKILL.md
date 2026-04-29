---
name: hykj-upload-any
description: "@hykj-js/vue3-element-plus UploadAny: 通用上传组件，onBeforeNormalUpload全局配置上传接口，v-model绑定文件列表"
---

# UploadAny — 通用上传

```vue
<script setup lang="ts">
import { UploadAny, onBeforeNormalUpload } from '@hykj-js/vue3-element-plus'

// 全局配置一次（通常在 main.ts 或应用初始化）
onBeforeNormalUpload((payload) => {
  payload.url = '/file/upload'
  payload.method = 'post'
  if (payload.file?.raw) {
    payload.formData.append('file', payload.file.raw)
  }
  // payload.headers['Authorization'] = `Bearer ${token}`
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

`payload` 字段：`url`（必填）、`method`、`formData`（FormData）、`headers`、`file`（ElUploadFile）。

组件 v-model 值为 `{ url: string; name: string; ... }[]`，上传成功后自动追加。
