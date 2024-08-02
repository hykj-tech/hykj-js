<template>
  <div class="flex gap-[20px]">
    <div class="mock-mobile-container">
      <div class="list">
        <div
          v-for="item of state.list"
          :key="item.id"
          class="item"
        >
          <div>{{ item.name }}</div>
        </div>
      </div>
      <div
        class="loading-tips"
        @click="loadNextPage()"
      >
        {{ loadingTipTest }}
      </div>
    </div>
    <el-button @click="resetPaginationAndLoad">
      重置
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { query, 人, 假数据库 } from '@/utils/mockData'
import { useList } from '@hykj-js/vue3-element-plus'
const {
  state,
  hasNextPage,
  loadData,
  loadNextPage,
  pagination,
  resetPaginationAndLoad,
} = useList<人>({
  useConcat: true,
  query,
  fetchFunc: async () => {
    logger.log('fetchFunc运行:', {
      query,
      pagination,
    })
    const result = await 假数据库.search(query, pagination)
    return [result.list, result.total, null]
  },
  pagination: {
    size: 5,
  },
  deleteFunc: async (row: any) => {
    // 模拟删除一行数据
    await 假数据库.delete(row)
  },
})
const loadingTipTest = computed(() => {
  if (state.loading) {
    return '加载中...'
  }
  if (pagination.total === 0) {
    return '暂无数据'
  }
  if (hasNextPage.value) {
    return '加载更多'
  } else {
    return '没有更多了'
  }
})
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.mock-mobile-container {
  flex-shrink: 0;
  height: 400px;
  width: 400px;
  border: solid 1px #ccc;
  padding: 20px;
  overflow: auto;
  .list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
    .item {
      width: 100%;
      height: 60px;
      background-color: #eee;
      border-radius: 10px;
    }
  }
  .loading-tips {
    height: 40px;
    line-height: 40px;
    text-align: center;
    border-radius: 10px;
    cursor: pointer;
  }
}
</style>
