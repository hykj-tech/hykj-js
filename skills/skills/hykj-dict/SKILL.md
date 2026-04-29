---
name: hykj-dict
description: "@hykj-js/vue3-hooks 字典/翻译: registerLocalDictData注册本地字典、registerTranslateDefine注册远程字典(按需拉取)、translate函数翻译value为text"
---

# 字典 / 翻译

```bash
pnpm add @hykj-js/vue3-hooks @hykj-js/shared vue
```

## 注册本地字典（启动时一次性）

```ts
import { registerLocalDictData } from '@hykj-js/vue3-hooks'

registerLocalDictData({
  STATUS: [
    { value: 1, text: '启用' },
    { value: 0, text: '禁用' },
  ],
  GENDER: [
    { value: 'M', text: '男' },
    { value: 'F', text: '女' },
  ],
})
```

## 注册远程字典（按 key 前缀异步拉取）

```ts
import { registerTranslateDefine } from '@hykj-js/vue3-hooks'

registerTranslateDefine({
  match: (key) => key?.startsWith('SYS_'),
  getData: async (dictKey) => {
    const [data] = await FetchData({ url: `/dict/${dictKey}` })
    return data   // 返回数组
  },
  formatKeyMap: { value: 'code', text: 'name' },  // 字段映射
})
```

## 翻译

```ts
import { translate } from '@hykj-js/vue3-hooks'

const label = translate('STATUS', 1)           // '启用'
const label2 = await translate('SYS_DEPT', 5)  // 远程字典异步翻译
```

## 扩展本地字典数据

```ts
import { registerLocalDictDataExtend } from '@hykj-js/vue3-hooks'

// 在初始注册后追加（例如动态加载的字典）
registerLocalDictDataExtend({ EXTRA_TYPE: [...] })
```
