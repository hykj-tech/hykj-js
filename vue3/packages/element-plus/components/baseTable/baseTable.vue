<template>
  <tableCp
      v-bind="props"
      @selection-change="emit('selection-change', $event)"
      @select-all="emit('select-all', $event)"
      @select="emit('select', $event)"
      @refresh="emit('refresh', $event)"
      @row-click="emit('row-click', $event)"
      @size-change="emit('size-change', $event)"
      @current-change="emit('current-change', $event)"
  ></tableCp>
</template>

<script setup lang="ts">
import tableCp from './table.vue'
type TableProps = {
 useTableTool?: boolean,
  usePagination?: boolean,
  pagination?: object,
  selectable?: boolean,
  rowKey?: string,
  useSelection?: boolean,
  columns?: object[],
  useReserveSelection?: boolean,
  notZeroNumber?: boolean,
  columnAlign?: string,
  tableOptions?: object,
  data: object[],
  loading?: boolean,
  topActionsReverse?: boolean,
  treeProps?: object,
  showTdChildren?: boolean,
  openKeys?: string[],
}
const props = defineProps<TableProps>()
const emit = defineEmits({
  'selection-change': (selection: object[]) => true,
  'select-all': (selection: object[]) => true,
  'select': (selection: object[], row: object) => true,
  'refresh': () => true,
  'row-click': (row: object) => true,
  'size-change': (size: number) => true,
  'current-change': (current: number) => true,
})
</script>

<style scoped>

</style>
