---
name: hykj-dict
description: 使用 @hykj-js/vue3-hooks 的字典翻译系统（registerLocalDictData/registerTranslateDefine/translate/dictTranslate）及 @hykj-js/vue3-element-plus 的 DictInput 字典选择器组件。当用户需要枚举翻译、下拉选择字典数据、或问"怎么用字典/翻译"时使用。
---

# 字典 / 翻译系统 + DictInput

@hykj-js 的字典系统分两层：

1. **数据层**（vue3-hooks）— 注册字典数据、翻译 value→text
2. **UI 层**（vue3-element-plus）— DictInput 字典选择器组件

```bash
pnpm add @hykj-js/vue3-hooks @hykj-js/shared vue
# 如需 DictInput：
pnpm add @hykj-js/vue3-element-plus element-plus
```

## 本地字典（静态枚举）

适用于前端已知的固定枚举值，如状态、性别等。

```ts
import { registerLocalDictData } from '@hykj-js/vue3-hooks'

// 应用启动时一次性注册
registerLocalDictData({
  STATUS: [
    { value: 1, text: '启用' },
    { value: 0, text: '禁用' },
  ],
  GENDER: [
    { value: 'M', text: '男' },
    { value: 'F', text: '女' },
  ],
  ORDER_TYPE: [
    { value: 'normal', text: '普通订单', style: '{"color":"#666"}' },
    { value: 'urgent', text: '加急订单', style: '{"color":"red","fontWeight":"bold"}' },
  ],
})
```

## 远程字典（按需异步拉取）

适用于由后端维护的字典数据，按 key 前缀匹配并按需加载。

```ts
import { registerTranslateDefine } from '@hykj-js/vue3-hooks'

registerTranslateDefine({
  // 只有 key 匹配时才触发此定义
  match: (key) => key?.startsWith('SYS_'),
  // 获取字典数据
  getData: async (dictKey) => {
    const [data] = await FetchData({ url: `/dict/${dictKey}` })
    return data  // 返回原始数组
  },
  // 字段映射：告诉系统如何从原始数据中提取 value/text
  formatKeyMap: { value: 'code', text: 'name' },
})
```

### TranslateDefine 全部字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `match` | `(dictKey?: string) => boolean` | 判断该字典是否由此定义处理 |
| `getData` | `(dictKey: string) => Promise<any>` | 获取字典原始数据 |
| `formatKeyMap` | `{ value, text, style?, remark?, sort?, children?, otherProps? }` | 字段映射，映射原始数据字段到 DictObj |
| `formatter` | `(data: any) => Partial<DictObj>` | 自定义格式化函数，返回的字段会合并到默认格式化结果上 |

## 翻译 value → text

```ts
import { translate, dictTranslate } from '@hykj-js/vue3-hooks'

// 同步翻译（本地字典）
const label = translate('STATUS', 1)            // '启用'

// 异步翻译（远程字典），需 await
const label2 = await translate('SYS_DEPT', 5)   // '研发部'

// dictTranslate — 获取完整 DictObj，含样式
const result = dictTranslate('ORDER_TYPE', 'urgent')
// { detail: { value: 'urgent', text: '加急订单', style: '...' },
//   text: '加急订单',
//   style: { color: 'red', fontWeight: 'bold' } }
```

`translate` 与 `dictTranslate` 的区别：
- `translate(key, value)` — 返回 `string`（纯文本），远程字典自动尝试异步加载
- `dictTranslate(key, value)` — 返回 `{ detail: DictObj, text: string, style: Record<string, string> }`，BaseTable 的 `dictKey` 列内部使用此方法

## 获取字典数据

```ts
import { getDictData, useDictData, ensureDictData } from '@hykj-js/vue3-hooks'

// 同步获取（依赖响应式，字典未加载时返回空数组，加载后自动更新）
const statusOptions = getDictData('STATUS')  // [{ value: '1', text: '启用' }, ...]

// Vue3 响应式版本
const statusOptions = useDictData('STATUS')  // ComputedRef<DictObj[]>

// 批量预加载（确保多个字典数据就绪）
await ensureDictData(['SYS_DEPT', 'SYS_ROLE', 'SYS_TAG'])
```

## DictObj 结构

```ts
type DictObj = {
  dictKey?: string
  value: string | number      // 字典值（统一为 string）
  text: string                // 显示文本
  sort?: string | number      // 排序
  style?: string | Record<string, string>  // 样式（JSON string 或对象）
  remark?: string             // 备注
  children?: DictObj[]        // 子选项（级联）
  hasChildren?: boolean       // 是否有子级
  path?: string[]             // 值路径（级联）
  textPath?: string[]         // 文本路径（级联）
}
```

## 扩展本地字典

```ts
import { registerLocalDictDataExtend } from '@hykj-js/vue3-hooks'

// 初始注册后追加（如动态加载或运行时修改）
registerLocalDictDataExtend({
  STATUS: [
    { value: 2, text: '已过期', style: '{"color":"#999"}' },
  ],
})
```

扩展会合并到已注册的同 key 字典中，相同 value 的字段会被覆盖（value 除外）。

## DictInput — 字典选择器组件

依赖字典已注册，提供 `select` / `radio` / `checkbox` 三种类型的表单输入。

```vue
<script setup lang="ts">
import { DictInput } from '@hykj-js/vue3-element-plus'

const status = ref(1)
const deptId = ref('')
const gender = ref('M')
const tags = ref<string[]>([])
</script>

<template>
  <!-- 下拉选择（默认 type="select"） -->
  <DictInput v-model="status" dict-key="STATUS" />

  <!-- 远程字典下拉 -->
  <DictInput v-model="deptId" dict-key="SYS_DEPT" type="select" />

  <!-- radio 单选组 -->
  <DictInput v-model="gender" dict-key="GENDER" type="radio" />

  <!-- checkbox 多选组（v-model 为数组） -->
  <DictInput v-model="tags" dict-key="TAG_LIST" type="checkbox" />
</template>
```

### DictInput Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string \| number \| (string\|number)[]` | — | v-model 绑定值 |
| `dictKey` | `string` | — | 字典 key，对应注册时的 key |
| `type` | `'select' \| 'radio' \| 'checkbox'` | `'select'` | 选择器类型 |
| `placeholder` | `string` | — | 占位文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `clearable` | `boolean` | — | 是否可清空 |

## 核心流程总结

```
registerLocalDictData({ STATUS: [...] })        ← 应用启动时注册
registerTranslateDefine({ match, getData, ... }) ← 远程字典定义

        ↓
  translate('STATUS', 1)  →  '启用'            ← 翻译值→文本
  dictTranslate('STATUS', 1) → { text, style }  ← BaseTable 用
  getDictData('STATUS') → [{ value, text }]     ← 获取全部选项
        ↓
  <DictInput v-model="x" dict-key="STATUS" />   ← 表单组件
```

## 常见场景

### 在 BaseTable 中使用字典

```ts
const columns = [
  { prop: 'status', label: '状态', dictKey: 'STATUS' },  // 自动翻译
]
```

### 在表单中选择字典

```vue
<el-form-item label="状态">
  <DictInput v-model="form.status" dict-key="STATUS" />
</el-form-item>
<el-form-item label="类型">
  <DictInput v-model="form.type" dict-key="ORDER_TYPE" type="radio" />
</el-form-item>
```

### 配合 el-select 手动使用字典数据

```vue
<el-select v-model="status">
  <el-option
    v-for="item in useDictData('STATUS')"
    :key="item.value"
    :label="item.text"
    :value="item.value"
  />
</el-select>
```

## 注意

- 字典数据是全局响应式的，注册后整个应用共享
- 远程字典首次访问时自动拉取，后续直接读缓存（`loadingStatusMap` 记录加载状态）
- 远程字典加载失败后下次访问会重新尝试
- `dictKey` 不区分大小写... 实际上是区分大小写的，注意 key 的一致性
- `translate` 在远程字典未加载时返回空字符串 `''`
