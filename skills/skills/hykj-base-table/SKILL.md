---
name: hykj-base-table
description: 使用 @hykj-js/vue3-element-plus 的 BaseTable 增强表格组件。当用户需要带分页/排序/列配置持久化的数据表格、或问"怎么用表格组件"时使用。
---

# BaseTable — 增强 ElTable

`BaseTable` 是对 `el-table` 的高阶封装，集成了分页、列配置持久化、字典翻译、自动序号等功能，通过 `columns` 配置驱动渲染。

```bash
pnpm add @hykj-js/vue3-element-plus @hykj-js/vue3-hooks @hykj-js/shared element-plus vue
```

## 基础用法

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

## Props 概览

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `RowType[]` | — | 表格数据 |
| `columns` | `BaseTableColumn[]` | — | 列定义数组 |
| `pagination` | `BaseTablePagination` | — | 分页对象，`v-model` 绑定 |
| `loading` | `boolean` | `false` | loading 状态 |
| `usePagination` | `boolean` | `false` | 是否显示分页组件 |
| `useTableTool` | `boolean` | `false` | 是否显示表格工具栏（刷新 + 列配置） |
| `useSelection` | `boolean` | `false` | 是否开启行选择 |
| `useReserveSelection` | `boolean` | `false` | 翻页时保留选中 |
| `rowKey` | `string` | `''` | 行 key，树形列表必传 |
| `hightCurrentRow` | `boolean` | `false` | 是否高亮当前行 |
| `columnAlign` | `string` | `''` | 全局列对齐方式 |
| `notZeroNumber` | `boolean` | `false` | 数字 0 是否视为非空 |
| `tableOptions` | `Record<string, any>` | `{}` | 透传给 el-table 的其他属性 |
| `topActionsReverse` | `boolean` | `false` | 顶部工具栏布局反转 |
| `paginationJustify` | `string` | `'flex-end'` | 分页组件对齐方式 |

## BaseTableColumn 列定义

| 字段 | 类型 | 说明 |
|------|------|------|
| `prop` | `string` | 数据字段名，`'$autoPageIndex'` 表示自动序号列 |
| `label` | `string` | 表头文字 |
| `width` | `number \| string` | 列宽 |
| `fixed` | `'left' \| 'right'` | 固定列（此列不可在列配置面板中隐藏） |
| `sortable` | `boolean` | 开启列排序 |
| `align` | `string` | 列对齐方式 |
| `formatter` | `(value, row, allData) => any` | 自定义格式化，返回值作为显示文本 |
| `dictKey` | `string` | 字典 key，自动调用 `dictTranslate` 翻译 value→text |
| `slot` | `string` | 自定义插槽名，模板中使用 `#item.<slot>="{ row, value, valueShow }"` |
| `styles` | `(value, row, allData) => Record<string, string>` | 动态单元格样式 |
| `color` | `string` | 快捷文字颜色（仅当值非空时生效） |
| `show-overflow-tooltip` | `boolean` | 溢出省略 + hover 显示 tooltip |
| `hide` | `boolean` | 默认隐藏（用户可通过列配置面板显示） |

### formatter 与 slot 的区别

- `formatter` — 只需要改变**显示文本**时使用，返回纯文本
- `slot` — 需要**自定义 HTML 结构**时使用（按钮、标签、图片等）

```ts
// formatter: 改变文本显示
{ prop: 'status', label: '状态', formatter: ({ row }) => row.status === 1 ? '启用' : '禁用' }

// slot: 自定义 HTML
{ label: '操作', slot: 'action', fixed: 'right' }
```
```vue
<template #action="{ row, value, valueShow }">
  <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ valueShow }}</el-tag>
</template>
```

### 字典翻译列

```ts
// 直接指定 dictKey，BaseTable 内部调用 dictTranslate 翻译
{ prop: 'status', label: '状态', dictKey: 'STATUS' }
// 同时支持 formatter 做二次处理
{ prop: 'type', label: '类型', dictKey: 'ORDER_TYPE', formatter: ({ row }) => row.type }
```

### 动态样式

```ts
{
  prop: 'amount',
  label: '金额',
  styles: (value) => {
    if (value > 1000) return { color: 'red', fontWeight: 'bold' }
    return {}
  }
}
```

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `@load` | — | 分页变化或刷新时触发，通常在此加载数据 |
| `@refresh` | — | 点击刷新按钮时触发 |
| `@selection-change` | `selection: RowType[]` | 选中行变化 |
| `@select` | `selection, row` | 单行选择变化 |
| `@select-all` | `selection` | 全选 |
| `@row-click` | `row` | 行点击 |
| `@current-change` | `page: number` | 页码变化 |
| `@size-change` | `size: number` | 每页条数变化 |

## 插槽

| 插槽 | 作用 |
|------|------|
| `#top-actions` | 顶部工具栏的自定义操作按钮区域 |
| `#item.<prop>` | 自定义列内容，`prop` 对应 columns 中 `slot` 字段 |
| `#header.<prop>` | 自定义表头 |
| 默认插槽 | 追加额外的 `el-table-column`（如 index 列） |

## 列配置持久化

当 `useTableTool: true` 时，工具栏显示刷新和列配置按钮。用户点击列配置可勾选列的显隐，配置自动保存到 localStorage（key 为表格所在路由 path + table index），刷新页面后保持。

- 设置了 `fixed` 属性的列不可隐藏（`disabledHide: true`）
- 列定义中 `hide: true` 表示默认隐藏，用户可手动开启

## 暴露方法

通过 `ref` 可调用：

```ts
const tableRef = ref()

tableRef.value.toggleRowSelection(row, true)   // 切换行选中
tableRef.value.clearSelection()                 // 清空选中
tableRef.value.setCurrentRow(row)               // 设置高亮行
```

## 完整示例

```vue
<script setup lang="ts">
import { BaseTable, type BaseTableColumn } from '@hykj-js/vue3-element-plus'

const columns: BaseTableColumn<User>[] = [
  { prop: '$autoPageIndex', label: '序号', width: 70 },
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'status', label: '状态', dictKey: 'STATUS', width: 100 },
  { prop: 'amount', label: '金额', sortable: true,
    styles: (v) => v > 1000 ? { color: 'red' } : {} },
  { prop: 'createdAt', label: '创建时间', width: 180, sortable: true },
  { label: '操作', slot: 'action', fixed: 'right', width: 150 },
]

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const list = ref<User[]>([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  const [res] = await FetchData<{ list: User[]; total: number }>({
    url: '/user/page',
    params: { page: pagination.page, pageSize: pagination.pageSize },
  })
  if (res) {
    list.value = res.list
    pagination.total = res.total
  }
  loading.value = false
}
</script>

<template>
  <BaseTable
    :data="list"
    :columns="columns"
    :pagination="pagination"
    :loading="loading"
    use-pagination
    use-table-tool
    use-selection
    row-key="id"
    @load="loadData"
    @selection-change="(s) => (selected = s)"
  >
    <template #top-actions>
      <el-button type="primary" @click="add">新增</el-button>
    </template>
    <template #action="{ row }">
      <el-button size="small" @click="edit(row)">编辑</el-button>
      <el-button size="small" type="danger" @click="del(row)">删除</el-button>
    </template>
  </BaseTable>
</template>
```

## 注意

- `columns` 中设置了 `fixed` 的列不可隐藏
- `useTableTool` 的列配置面板延迟 1 秒挂载（等待路由信息就绪）
- 树形列表需同时传 `row-key` 和 `tree-props`
- 自动高度（`autoHeight`）已废弃，推荐通过 CSS 布局控制高度
