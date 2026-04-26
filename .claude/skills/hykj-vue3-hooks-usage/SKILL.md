---
name: hykj-vue3-hooks-usage
description: 在外部 Vue3 业务工程使用 @hykj-js/vue3-hooks（useCommonList 列表查询/分页/瀑布流、useCommonToggle、useResettableState/Ref、translate 字典翻译）。当用户问"怎么用 @hykj-js/vue3-hooks 的 xxx" 或集成列表/字典 hook 时使用。
---

# `@hykj-js/vue3-hooks` 使用指南

```bash
pnpm add @hykj-js/vue3-hooks @hykj-js/shared @vueuse/core vue
```

`@vueuse/core >= 12.3.0` 与 `@hykj-js/shared` 是 peer 依赖。

## 1. useCommonList — 通用列表 / 分页 / 瀑布流

```ts
import { useCommonList } from '@hykj-js/vue3-hooks'

const query = reactive({ name: '', status: '' })

const {
  list, loading, pagination,
  loadData, resetQuery, search,
  hasNextPage, loadNextPage,
  setRowNow, rowNow,
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
})

await loadData()
```

参数（`UseCommonListOptions`）：

- `query`：响应式查询对象（reactive 推荐，会做 raw 备份用于重置）
- `fetchFunc`：必传，返回 `{ list, total }`
- `pagination`：默认分页配置
- `rowIdKey`：默认 `'id'`
- `useConcat`：true 时 `loadNextPage` 累加而不替换（移动端瀑布流）
- `loadDataThrottleTime`：节流毫秒数

## 2. useCommonToggle — 布尔状态

```ts
const dialog = useCommonToggle()
dialog.open()      // value=true
dialog.close()
dialog.toggle()    // 翻转
dialog.toggle(true)
```

## 3. useResettableState / useResettableRef

```ts
const [form, resetForm] = useResettableState({ name: '', age: 0 })
form.name = 'x'
resetForm()  // 回到 { name: '', age: 0 }

const [count, resetCount] = useResettableRef(0)
count.value++; resetCount()
```

`useResettableState` 仅接受对象类型；非对象用 `useResettableRef`。

## 4. translate — 字典 / 翻译

```ts
import {
  registerLocalDictData,
  registerLocalDictDataExtend,
  registerTranslateDefine,
} from '@hykj-js/vue3-hooks'

// 启动时一次性注册：
registerLocalDictData({
  STATUS: [{ value: 1, text: '启用' }, { value: 0, text: '禁用' }],
})

// 服务端字典（按需异步拉取）
registerTranslateDefine({
  match: (k) => k?.startsWith('SYS_'),
  getData: async (dictKey) => {
    const [data] = await FetchData({ url: `/dict/${dictKey}` })
    return data
  },
  formatKeyMap: { value: 'code', text: 'name' },
})
```

## 注意

- 这些 hook 内部用 `vue-demi`，可在 vue2.7+ 与 vue3 双端使用
- 业务工程的 vue 必须版本 >= 3.4.21（peer 约束）
