---
name: hykj-use-list
description: 使用 @hykj-js/vue3-hooks 的 useCommonList 分页/瀑布流列表 hook，及 @hykj-js/vue3-element-plus 的 useList（带删除确认）。当用户需要实现分页列表、搜索、瀑布流加载、或带删除功能的列表时使用。
---

# useCommonList / useList — 通用列表

`useCommonList` 管理列表的所有状态（数据、loading、分页），`useList` 在其基础上增加了删除确认功能。

```bash
pnpm add @hykj-js/vue3-hooks @hykj-js/shared @vueuse/core vue
# 如需 useList（删除功能）：
pnpm add @hykj-js/vue3-element-plus element-plus
```

## useCommonList — 分页列表

### 基础用法

```ts
import { useCommonList } from '@hykj-js/vue3-hooks'

const query = reactive({ name: '', status: '' })

const {
  state,            // { list, loading, rowNow }
  pagination,       // { current, size, total, sizes, layout }
  loadData,         // 加载数据（使用当前 pagination）
  search,           // 重置到第 1 页 + loadData
  resetQuery,       // 重置 query 到初始值
  resetPage,        // 重置 query + 分页 + loadData
  resetPaginationAndLoad,  // 重置分页 + loadData
  hasNextPage,      // computed，瀑布流用
  loadNextPage,     // 累加下一页（需 useConcat: true）
  setRowNow,        // 标记当前行
  updateDefaultQuery,  // 动态修改 query 默认值
} = useCommonList<User>({
  query,
  rowIdKey: 'id',
  pagination: { pageSize: 20 },
  fetchFunc: async ({ query, pagination }) => {
    const [res] = await FetchData<{ list: User[]; total: number }>({
      url: '/user/page',
      params: { ...query, ...pagination },
    })
    return { list: res!.list, total: res!.total }
  },
  useConcat: false,
  loadDataThrottleTime: 300,
})

await loadData()
```

### UseCommonListOptions 参数

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `query` | `reactive 对象` | — | 查询条件（响应式），`resetQuery` 会还原到初始值 |
| `fetchFunc` | `async (params) => result` | — | **必传**，返回 `{ list, total }` 或 `[list, total]` 或 `{ list, total, err }` |
| `pagination` | `{ size?, current?, total?, sizes?, layout? }` | `{ size: 10, current: 1 }` | 初始分页配置 |
| `rowIdKey` | `string` | `'id'` | 行唯一标识字段，用于 `setRowNow` 和瀑布流去重 |
| `useConcat` | `boolean` | `false` | 瀑布流模式，`loadNextPage` 累加数据到 `list` 末尾 |
| `loadDataThrottleTime` | `number` | `200` | loadData 节流时间 (ms)，快速操作防抖 |

### fetchFunc 的两种返回格式

```ts
// 对象格式
fetchFunc: async ({ query, pagination }) => {
  const [res] = await FetchData({ url: '/list', params: { ...query, ...pagination } })
  return { list: res!.list, total: res!.total }
}

// 元组格式（跟 FetchData 风格一致）
fetchFunc: async ({ query, pagination }) => {
  const [res] = await FetchData({ url: '/list', params: { ...query, ...pagination } })
  return [res!.list, res!.total] as const
}

// 带显式错误的返回（err 存在时不会更新列表状态）
fetchFunc: async ({ query, pagination }) => {
  const [data, err] = await FetchData({ url: '/list', params: { ...query, ...pagination } })
  if (err) return { list: [], total: 0, err }
  return { list: data!.list, total: data!.total }
}
```

### fetchFunc 接收的 params

```ts
{
  pagination: { size: number; current: number },  // 本次请求的分页参数
  list: RowType[],   // 请求前的列表数据
  total: number,     // 请求前的总数
}
```

### 关键方法说明

| 方法 | 说明 |
|------|------|
| `loadData(options?)` | 用当前 pagination + query 加载。`options.loading: false` 可不显示 loading；`options.resetConcat: true` 重置瀑布流；`options.ignoreThrottle: true` 跳过节流 |
| `search()` | `pagination.current = 1` 后 `loadData()`，搜索按钮/回车搜索用 |
| `resetQuery()` | 将 query 恢复为初始值（不改分页，不加载） |
| `resetPage(options?)` | `resetQuery()` + `resetPagination()` + `loadData({ resetConcat: true })`，常用于重置按钮。`options.clearList: true` 先清空再加载 |
| `resetPaginationAndLoad()` | 重置分页 + 加载，常用于 pageSize 变化时 |
| `loadNextPage()` | `hasNextPage` 为 true 时页码 +1 并加载，数据追加到 list |
| `setRowNow(row)` | 标记当前行（响应式），同时更新 `state.rowNow` |
| `updateDefaultQuery(obj)` | 动态修改 query 的默认值（影响 `resetQuery` 的还原基准） |

### 响应式返回值

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `state.list` | `Ref<RowType[]>` | 列表数据 |
| `state.loading` | `Ref<boolean>` | 加载状态 |
| `state.rowNow` | `Ref<RowType \| null>` | 当前标记行 |
| `pagination` | `reactive` | 分页对象，可直接绑定 el-pagination |
| `hasNextPage` | `ComputedRef<boolean>` | 是否还有下一页 |

### 常见场景

**场景 1：搜索**

```ts
// query 变化时自动搜索（需配合 watch 去抖）
watch(
  () => ({ ...query }),
  () => { search() },
  { deep: true }
)
```

**场景 2：重置**

```ts
const onReset = () => { resetPage() }
```

**场景 3：pageSize 切换**

```ts
watch(() => pagination.size, () => { resetPaginationAndLoad() })
```

**场景 4：移动端瀑布流**

```ts
const { list, hasNextPage, loadNextPage, loading } = useCommonList({
  query,
  useConcat: true,  // 开启瀑布流
  fetchFunc: async ({ query, pagination }) => {
    const [res] = await FetchData({ url: '/feed', params: { ...query, ...pagination } })
    return { list: res!.list, total: res!.total }
  },
})

// 触底时
onReachBottom(() => {
  if (!loading.value && hasNextPage.value) loadNextPage()
})
```

## useList — 带删除确认的列表

`useList` 继承 `useCommonList` 的全部功能，额外提供 `deleteRow` 方法（内置 loadingConfirm 对话框 + 删除后自动刷新）。

```ts
import { useList } from '@hykj-js/vue3-element-plus'

const { list, loadData, deleteRow } = useList<User>({
  query,
  fetchFunc: async ({ query, pagination }) => {
    const [res] = await FetchData({ url: '/user/page', params: { ...query, ...pagination } })
    return { list: res!.list, total: res!.total }
  },
  deleteFunc: async (row) => {
    await FetchData({ url: `/user/${row.id}`, method: 'delete' })
  },
  rowTitleKey: 'name',  // 删除确认弹窗中显示的字段，默认 'name'
})
```

```vue
<template>
  <el-button @click="deleteRow(row)">删除</el-button>
</template>
```

`deleteRow(row)` 流程：
1. 调用 `setRowNow(row)` 标记当前行
2. 弹出 `loadingConfirm` 对话框，显示 `<数据"xxx">将被删除，是否继续？`
3. 确认后调用 `deleteFunc(row)` + 提示"删除成功" + `loadData()` 刷新
4. 加载完成后 `setRowNow(null)` 清除标记

## 完整示例：分页列表 + 搜索 + 删除

```ts
// composables/useUserList.ts
import { useList } from '@hykj-js/vue3-element-plus'

export function useUserList() {
  const query = reactive({ name: '', status: '' })

  return useList<User>({
    query,
    pagination: { pageSize: 20 },
    rowIdKey: 'id',
    rowTitleKey: 'name',
    fetchFunc: async ({ query, pagination }) => {
      const [res] = await FetchData<{ list: User[]; total: number }>({
        url: '/user/page',
        params: { ...query, page: pagination.current, pageSize: pagination.size },
      })
      return { list: res!.list, total: res!.total }
    },
    deleteFunc: async (row) => {
      await FetchData({ url: `/user/${row.id}`, method: 'delete' })
    },
  })
}
```

```vue
<script setup lang="ts">
const {
  state: { list, loading },
  pagination,
  loadData,
  search,
  resetPage,
  deleteRow,
} = useUserList()

onMounted(() => loadData())
</script>

<template>
  <BaseTable
    :data="list"
    :loading="loading"
    :columns="columns"
    :pagination="pagination"
    use-pagination
    @load="loadData"
  >
    <template #top-actions>
      <el-button @click="search()">搜索</el-button>
      <el-button @click="resetPage()">重置</el-button>
    </template>
    <template #action="{ row }">
      <el-button type="danger" @click="deleteRow(row)">删除</el-button>
    </template>
  </BaseTable>
</template>
```

## 注意

- `useCommonList` 内部使用 `useThrottleFn`（来自 `@vueuse/core`），默认节流 200ms
- `loadData` 有并发锁保护：同一次 `loadData` 中会忽略后续重复调用
- 瀑布流模式会自动按 `rowIdKey` 去重
- 翻页时如果当前页无数据（如删除最后一页最后一条），会自动退回上一页
- `updateDefaultQuery` 可动态修改 query 默认值，适用于搜索条件联动场景（如切换 tab 时重置部分条件）
