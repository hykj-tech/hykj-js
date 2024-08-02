<template>
  <div class="page-search-reload-btn">
    <el-button
      :icon="Search"
      type="primary"
      @click="search"
    >
      {{
        props.searchBtnText
      }}
    </el-button>
    <el-button
      v-if="props.searchBtnText"
      :icon="RefreshLeft"
      @click="reset"
    >
      {{
        props.resetBtnText
      }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Search, RefreshLeft } from '@element-plus/icons-vue'
type Props = {
  // 是否显示重置按钮
  showResetBtn?: boolean
  // 查询按钮的文本
  searchBtnText?: string
  // 重置按钮的文本
  resetBtnText?: string
}
// 获取props，并赋予一些初始值
const props = withDefaults(defineProps<Props>(), {
  showResetBtn: true,
  searchBtnText: '查询',
  resetBtnText: '重置',
})
// 定义事件
const emit = defineEmits(['search', 'reset'])
function search() {
  emit('search')
}
function reset() {
  emit('reset')
}
</script>

<style scoped></style>
