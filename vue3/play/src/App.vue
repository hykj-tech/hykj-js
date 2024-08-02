<script setup lang="ts">
import TestPage from './testPage/index.vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div>
      <TestPage />
    </div>
  </el-config-provider>
</template>

<style scoped>
</style>
