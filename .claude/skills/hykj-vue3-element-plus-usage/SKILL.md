---
name: hykj-vue3-element-plus-usage
description: 在外部 Vue3 + Element Plus 工程使用 @hykj-js/vue3-element-plus（BaseTable、UploadAny、DictInput、mediaFilePreview、useList、loadingConfirm、requestErrorMessage）。当用户问"怎么用 @hykj-js/vue3-element-plus 的 xxx" 或集成增强表格/上传组件时使用。
---

# `@hykj-js/vue3-element-plus` 使用指南

```bash
pnpm add @hykj-js/vue3-element-plus @hykj-js/vue3-hooks @hykj-js/shared element-plus vue
```

## 全局安装（按需）

```ts
import { createApp } from 'vue'
import HykjElementPlus from '@hykj-js/vue3-element-plus'
import App from './App.vue'

createApp(App).use(HykjElementPlus).mount('#app')
```

按需用法：直接 `import { BaseTable, UploadAny, DictInput } from '@hykj-js/vue3-element-plus'`，每个组件自带 install 方法。

## 1. BaseTable — 增强 ElTable

```vue
<script setup lang="ts">
import { BaseTable, type BaseTableColumn } from '@hykj-js/vue3-element-plus'
const columns: BaseTableColumn[] = [
  { prop: 'name', label: '姓名' },
  { prop: 'status', label: '状态', formatter: ({ row }) => row.status === 1 ? '启用' : '禁用' },
]
</script>

<template>
  <BaseTable :data="list" :columns="columns" :pagination="pagination" @load="loadData" />
</template>
```

支持列配置持久化（`tableConfiguration.vue` 提供配置面板）。

## 2. UploadAny — 通用上传

```vue
<script setup lang="ts">
import { UploadAny, onBeforeNormalUpload } from '@hykj-js/vue3-element-plus'

// 全局一次性配置上传请求
onBeforeNormalUpload((payload) => {
  payload.url = '/file/upload'
  payload.method = 'post'
  if (payload.file?.raw) payload.formData.append('file', payload.file.raw)
})
</script>

<template>
  <UploadAny v-model="fileList" :limit="5" accept="image/*,.pdf" />
</template>
```

`UploadAny` 内部会自动以默认配置创建 `HttpUtil` 实例并注入 `window.FetchData` 兜底。如果业务侧已经 `initHttpUtil()` 注入了，自定义那一份生效。

## 3. DictInput — 字典选择器

依赖 `@hykj-js/vue3-hooks` 的 `registerLocalDictData` / `registerTranslateDefine` 已注册。

```vue
<DictInput v-model="value" dict-key="STATUS" />
<DictInput v-model="userId" dict-key="SYS_USER" type="select" />
```

## 4. useList — 列表 + 删除确认（封装自 useCommonList）

```ts
import { useList } from '@hykj-js/vue3-element-plus'
const { list, loadData, deleteRow } = useList<User>({
  fetchFunc: ...,
  deleteFunc: async (row) => { await FetchData({ url: `/user/${row.id}`, method: 'delete' }) },
  rowTitleKey: 'name',  // 删除确认弹窗中显示的字段
})
```

## 5. loadingConfirm — 异步确认对话框

```ts
import { loadingConfirm } from '@hykj-js/vue3-element-plus'

await loadingConfirm(
  { title: '确认操作', message: '是否继续？', loadingText: '处理中...' },
  async (action) => {
    if (action === 'confirm') await doSomething()
  },
)
```

## 6. requestErrorMessage — 统一错误提示

```ts
import { requestErrorMessage } from '@hykj-js/vue3-element-plus'
const [data, err] = await FetchData(...)
if (err) requestErrorMessage(err)
```

## 7. mediaFilePreview — 函数式预览对话框

```ts
import { mediaFilePreview } from '@hykj-js/vue3-element-plus'
mediaFilePreview('https://x/y.mp4', { previewType: 'video' })
mediaFilePreview('https://x/file.pdf', { useWindowOpen: true })
```

## 注意

- `vue >= 3.4.21`、`element-plus >= 2.4.3` 是 peer 依赖
- element-plus 的 css **由业务工程**自行 import：`import 'element-plus/dist/index.css'`
- 与 `@hykj-js/shared` 的 `HttpUtil` 形成闭环：HttpUtil 抛 `HttpRequestError` → `requestErrorMessage` 转 `ElMessage`
