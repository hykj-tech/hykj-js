---
name: hykj-dict-input
description: "@hykj-js/vue3-element-plus DictInput: 基于字典key的选择器组件，type='select'|'radio'|'checkbox'，依赖vue3-hooks字典注册"
---

# DictInput — 字典选择器

依赖 `@hykj-js/vue3-hooks` 的字典已注册（`registerLocalDictData` / `registerTranslateDefine`）。

```vue
<script setup lang="ts">
import { DictInput } from '@hykj-js/vue3-element-plus'
</script>

<template>
  <!-- 下拉选择（默认） -->
  <DictInput v-model="status" dict-key="STATUS" />

  <!-- 远程字典下拉 -->
  <DictInput v-model="deptId" dict-key="SYS_DEPT" type="select" />

  <!-- radio 单选 -->
  <DictInput v-model="gender" dict-key="GENDER" type="radio" />

  <!-- checkbox 多选（v-model 为数组） -->
  <DictInput v-model="tags" dict-key="TAG_LIST" type="checkbox" />
</template>
```

`dict-key` 对应 `registerLocalDictData` / `registerTranslateDefine` 中注册的 key。
