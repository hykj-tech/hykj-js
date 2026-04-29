---
name: hykj-use-list
description: "@hykj-js/vue3-hooks useCommonList: 分页列表/瀑布流hook，管理list/loading/pagination状态，提供loadData/search/resetQuery/loadNextPage"
---

# useCommonList — 通用列表 / 分页 / 瀑布流

```bash
pnpm add @hykj-js/vue3-hooks @hykj-js/shared @vueuse/core vue
```

```ts
import { useCommonList } from '@hykj-js/vue3-hooks'

const query = reactive({ name: '', status: '' })

const {
  list,           // Ref<T[]>
  loading,        // Ref<boolean>
  pagination,     // { page, pageSize, total }
  loadData,       // 加载（用当前 pagination.page）
  search,         // 重置到第1页再 loadData
  resetQuery,     // 重置 query 到初始值 + search
  hasNextPage,    // Ref<boolean>，瀑布流用
  loadNextPage,   // 加载下一页并追加（需 useConcat: true）
  setRowNow,      // (row: T) => void，标记当前行
  rowNow,         // Ref<T|null>
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
  useConcat: false,             // true = 瀑布流模式（loadNextPage 追加）
  loadDataThrottleTime: 300,    // 节流 ms，可选
})

await loadData()
```

## UseCommonListOptions 关键字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `query` | `reactive object` | 查询条件，resetQuery 会还原到初始值 |
| `fetchFunc` | `async fn` | 必传，返回 `{ list, total }` |
| `rowIdKey` | `string` | 默认 `'id'`，用于 setRowNow 比对 |
| `useConcat` | `boolean` | 瀑布流模式，loadNextPage 累加 list |
| `pagination.pageSize` | `number` | 默认分页大小 |
