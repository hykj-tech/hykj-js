<template>
  <el-drawer
    title="表格配置"
    v-model="drawer"
    append-to-body
    :direction="direction"
  >
    <div class="cp-tableConfiguration">
      <baseTable
        style="height: 100%"
        :data="props.columnsData"
        :columns="tableColumns"
      >
        <template #item.isHide="{ row }">
          <el-switch
            :model-value="!row.hide"
            @change="changeRow(row, $event as boolean)"
            :disabled="row.disabledHide"
          >
          </el-switch>
        </template>
      </baseTable>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import {  ref ,defineAsyncComponent} from "vue";
import { ElSwitch, ElDrawer } from "element-plus";
const baseTable = defineAsyncComponent(() => import('./table.vue'));

const drawer = ref(false);
const direction = "rtl";
const tableColumns = ref([
  { prop: "label", label: "列名" },
  { prop: "isHide", label: "显示" },
]);

// 开关drawer
const toggle = (value?: boolean) => {
  drawer.value = value !== undefined ? value : !drawer.value;
};
const emit = defineEmits<{
  (e: "change");
}>();
const changeRow = (row: any, value: boolean) => {
  row.hide = !value;
  // 如果需要发出事件，需要使用`emit`函数
  emit("change");
};
defineExpose({
  toggle
});
// 定义props的类型
const props = defineProps<{
  columnsData: Array<[]>;
}>();
</script>
<style scoped lang="scss">
.cp-tableConfiguration {
  height: 100%;
  padding: 15px;
}
</style>
