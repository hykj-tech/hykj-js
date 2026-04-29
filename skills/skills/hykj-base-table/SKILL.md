---
name: hykj-base-table
description: "@hykj-js/vue3-element-plus BaseTable: 增强ElTable，columns配置驱动，内置分页/排序/列持久化，@load事件触发数据加载"
---

# BaseTable — 增强 ElTable

```bash
pnpm add @hykj-js/vue3-element-plus @hykj-js/vue3-hooks @hykj-js/shared element-plus vue
```

```vue
<script setup lang="ts">
import { BaseTable, type BaseTableColumn } from '@hykj-js/vue3-element-plus'

const columns: BaseTableColumn[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'status', label: '状态', formatter: ({ row }) => row.status === 1 ? '启用' : '禁用' },
  { prop: 'createdAt', label: '创建时间', sortable: true },
  { label: '操作', slot: 'action', fixed: 'right', width: 120 },
]

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const list = ref<User[]>([])

async function loadData() {
  const [res] = await FetchData({ url: '/user/page', params: pagination })
  list.value = res!.list
  pagination.total = res!.total
}
</script>

<template>
  <BaseTable
    :data="list"
    :columns="columns"
    :pagination="pagination"
    @load="loadData"
  >
    <template #action="{ row }">
      <el-button @click="edit(row)">编辑</el-button>
    </template>
  </BaseTable>
</template>
```

## BaseTableColumn 关键字段

| 字段 | 说明 |
|------|------|
| `prop` | 数据字段名 |
| `label` | 表头文字 |
| `formatter` | `({ row, column }) => string` 自定义渲染文本 |
| `slot` | 指定 slot 名，用于自定义列内容 |
| `sortable` | 开启列排序 |
| `fixed` | `'left'|'right'` 固定列 |
| `hide` | 默认隐藏（列配置持久化控制） |

`tableConfiguration.vue` 提供列显隐配置面板，由 BaseTable 内部集成。
