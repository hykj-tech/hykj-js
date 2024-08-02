<template>
  <h4>单选树形（带缓存）</h4>
  <dict-input
    v-model="treeDictInputValue"
    dict-key="tree_test_local"
    input-type="tree"
    :tree-options="{
      defaultExpandAll: true,
    }"
    :cache-data="cacheData"
    @change="treeDictInputOnChange"
  />
  <h4>多选树形</h4>
  <dict-input
    v-model="treeDictInputMultipleValue"
    dict-key="tree_test_local"
    input-type="tree"
    multiple
    :tree-options="{
      defaultExpandAll: true,
    }"
    :cache-data="cacheData"
    @change="treeDictInputMultipleOnChange"
  />
  <h4>普通select缓存cacheData测试</h4>
  <dict-input
    v-model="dictInputValue"
    dict-key="gender_local"
    :cache-data="selectCacheData"
  />
</template>

<script setup lang="ts">
import { DictInput } from '@hykj-js/vue3-element-plus'

// 树形dictInput测试
const treeDictInputValue = ref<string | number | undefined>('14')
// 当字典里面没有数据时，可以使用cacheData进行缓存
const cacheData = ref<any[]>([{ text: '百色', value: '14' }])
function treeDictInputOnChange(_value: string[] | number[] | undefined) {
  logger.log('treeDictInputOnChange:', treeDictInputValue.value)
}
// dictInput多选测试
const treeDictInputMultipleValue = ref<string[] | number[]>(['11', '21'])
function treeDictInputMultipleOnChange(_value: string[] | number[]) {
  logger.log('treeDictInputMultipleOnChange:', treeDictInputMultipleValue.value)
}
// 普通select缓存测试
const dictInputValue = ref<string | number | undefined>('4')
const selectCacheData = ref<any[]>([{ text: '不存在的性别', value: '4' }])
</script>

<style scoped></style>
