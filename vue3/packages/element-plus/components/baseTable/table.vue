<template>
  <div class="cpBaseTable" ref="cpBaseTable">
    <!--    表格上部分操作栏-->
    <div
      class="topActions"
      :data-reverse="props.topActionsReverse"
      v-if="showToActions"
      ref="topActions"
    >
      <div class="custom-top-actions">
        <!--        操作栏自定义插槽-->
        <slot name="top-actions"></slot>
      </div>
      <div style="flex-grow: 1"></div>
      <!--      操作栏自带的表格工具-->
      <div class="tableTool" v-if="props.useTableTool">
        <!--        刷新-->
        <el-button
          :icon="Refresh"
          size="small"
          circle
          @click="clickRefresh"
        ></el-button>
        <!--        表格配置-->
        <el-button
          :icon="Operation"
          size="small"
          circle
          @click="clickTableConfiguration"
        ></el-button>
      </div>
    </div>
    <div class="table-box">
      <!--    主表格渲染-->
      <el-table
        v-loading="props.loading"
        ref="table"
        class="table"
        :data="props.data"
        :row-key="props.rowKey"
        :default-expand-all="props.showTdChildren"
        :expand-row-keys="props.openKey"
        @selection-change="handleSelectionChange"
        :tree-props="props.treeProps || { children: 'children' }"
        @select="handleSelect"
        @select-all="selectAll"
        @row-click="rowClick"
        v-bind="tableOptionsToUse"
        :highlight-current-row="props.hightCurrentRow"
        height="100%"
      >
        <!-- 行选中功能 -->
        <el-table-column
          v-if="useSelection"
          :selectable="props.selectable"
          :reserve-selection="useReserveSelection"
          type="selection"
        ></el-table-column>
        <!-- 自定义列 -->
        <el-table-column
          v-for="(column, columnIndex) of finalColumns"
          :key="column.prop + columnIndex"
          v-bind="column"
          :align="column.align ? column.align : columnAlign || 'left'"
        >
          <!-- 自定义表头 -->
          <template v-slot:header="scope">
            <slot
              v-if="$slots[`header.${column.prop}`]"
              :name="`header.${column.prop}`"
              :column="scope.column"
            ></slot>
            <div v-else :style="{ ...columnHeaderStyle(column) }">
              {{ column.label }}
            </div>
          </template>
          <template v-slot="scope">
            <!-- 支持tooltip配置: tooltip不建议使用，废弃 -->
            <el-tooltip
              :disabled="column.tooltip !== true"
              effect="dark"
              :open-delay="500"
              :content="columnValueShow(column, scope.row)"
              placement="top"
              popper-class="tooltip-width"
            >
              <!-- slot是自定义作用于插槽渲染，支持当前列原始value，和使用formatter后的valueShow-->
              <!-- 使用方法 #item.name="{allRow,row,value,valueShow}"-->
              <slot
                v-if="$slots[`item.${column.prop}`]"
                :name="`item.${column.prop}`"
                :allRow="data"
                :row="(scope.row as RowType)"
                :index="((scope.$index + 1) as number)"
                :value="scope.row[column.prop]"
                :valueShow="columnValueShow(column, scope.row, scope.$index)"
              ></slot>
              <!--          默认渲染-->
              <div
                :class="{ textOverflow: column['show-overflow-tooltip'] }"
                v-else
                :style="({ ...columnStyles(column, scope.row) } as any)"
              >
                {{ columnValueShow(column, scope.row, scope.$index) }}
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <!-- 使用其他el-table原生方式扩展 -->
        <slot></slot>
      </el-table>
    </div>
    <div
      class="pagination"
      :style="{ justifyContent: props.paginationJustify }"
      v-if="usePagination"
      ref="pagination"
    >
      <el-pagination
        background
        :teleported="useTeleported"
        v-model:current-page="internalPagination.current"
        v-model:page-size="internalPagination.size"
        :page-sizes="internalPagination.sizes"
        :layout="internalPagination.layout"
        :total="internalPagination.total"
      >
      </el-pagination>
    </div>
    <TableConfiguration
      v-if="props.useTableTool && state.delayMounted"
      ref="tableConfiguration"
      @change="changeHide"
      :columnsData="state.internalColumns"
    ></TableConfiguration>
  </div>
</template>

<script lang="ts" setup generic="RowType extends Object">
import { Refresh, Operation } from "@element-plus/icons-vue";
import type {
  BaseTableSate,
  BaseTableProps,
  styleType,
  BaseTablePagination,
} from "./type";
import { dictTranslate } from "@hykj-js/vue3-hooks";
import {
  getCurrentInstance,
  defineAsyncComponent,
  ref,
  reactive,
  watch,
  onMounted,
  computed,
} from "vue";
import {
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTooltip,
  ElButton,
  vLoading,
} from "element-plus";
import { BaseTableColumn } from "./type";
const TableConfiguration = defineAsyncComponent(
  () => import("./tableConfiguration.vue")
);

type Props = BaseTableProps<RowType>;

// 组件的状态
const state = reactive<BaseTableSate<RowType>>({
  // 自动高度
  tableHeight: 0,
  // 选中数据
  internalSelection: [],
  showTableConfiguration: false,
  // 内部处理的columns数据
  internalColumns: [],
  delayMounted: false,
});

const props = withDefaults(defineProps<Props>(), {
  teleported: false,
  hightCurrentRow: false,
  useTableTool: false,
  paginationJustify: "flex-end",
  usePagination: false,
  rowKey: "",
  useSelection: false,
  useReserveSelection: false,
  autoHeight: false,
  height: false,
  notZeroNumber: false,
  // columns: [],
  columnAlign: "",
  tableOptions: null,
  // data: [],
  loading: false,
  topActionsReverse: false,
  treeProps: false,
  showTdChildren: false,
  // openKey: [],
});

// 由于pagination类型问题，这里还是维护一个内部pagination对象
const internalPagination = reactive<BaseTablePagination>(
  Object.assign(
    {
      current: 1,
      size: 10,
      total: 0,
      sizes: [10, 25, 50, 100],
      layout: "total, sizes, prev, pager, next, jumper",
    },
    props.pagination || {}
  )
);

watch(
  () => props.pagination,
  (newVal) => {
    Object.assign(internalPagination, newVal);
  },
  { deep: true }
);

watch(
  () => [internalPagination.current, internalPagination.size],
  (newVal) => {
    const isCurrentChange = newVal[0] !== props.pagination.current;
    const isSizeChange = newVal[1] !== props.pagination.size;
    // 直接修改props中的pagination对象属性，随后才更新事件
    if (isCurrentChange) {
      props.pagination.current = internalPagination.current;
      emit("current-change", internalPagination.current);
    }
    if (isSizeChange) {
      props.pagination.size = internalPagination.size;
      emit("size-change", internalPagination.size);
    }
  }
);

// 最终渲染的列
const finalColumns = computed(() => {
  return (
    state.internalColumns
      // 一些属性的转换
      .map((column: Record<string, any>) => {
        // 建议不再使用tooltip属性，使用show-overflow-tooltip
        if (column["showOverflowTooltip"] || column["overflowTooltip"]) {
          column["show-overflow-tooltip"] = true;
        }
        return column;
      })
      // 通过columns中的hide属性来判断是否显示
      .filter((column: Record<string, any>) => {
        column.show = !column.hide;
        // 如果column对象已经设置了fixed，那么用户无法自定义配置显示
        if (column.fixed !== undefined) {
          column.disabledHide = true;
          return true;
        } else {
          return !column.hide;
        }
      })
  );
});
const instance = getCurrentInstance();
// 是否显示 topActions
const showToActions = computed(() => {
  return props.useTableTool || instance.slots["top-actions"];
});

// 表格组件的父容器
const tableParent = computed(() => {
  const cpBaseTableDiv = cpBaseTable.value;
  return cpBaseTableDiv?.parentNode;
});

// el-table 最终使用的属性
const tableOptionsToUse = computed(() => {
  const defaultOption = {
    border: false, // 20230823 按照UI规范，目前默认false
  };
  const otherOptionProps: any = {
    "header-cell-class-name": "baseTable-commonHeaderRow", // 默认表头样式
    size: "small", // 默认表格尺寸
  };
  if (props.height) {
    Object.assign(defaultOption, {
      height: props.height,
    });
  }
  const ignoreAutoHeight = !!(props.height || props.tableOptions?.height);
  // 自动高度
  if (props.autoHeight && state.tableHeight && !ignoreAutoHeight) {
    otherOptionProps.height = state.tableHeight;
  }
  // rowKey设置
  if (props.rowKey) {
    otherOptionProps["row-key"] = props.rowKey;
  }
  return Object.assign(
    defaultOption,
    otherOptionProps,
    props.tableOptions || {}
  );
});

// 是否使用 teleported
const useTeleported = computed(() => {
  return props.teleported;
});
onMounted(() => {
  setTimeout(() => {
    state.delayMounted = true;
  }, 1000);
  updateInternalColumns();
});

// 更新内部columns
function updateInternalColumns() {
  state.internalColumns =
    props.columns?.map((column) => {
      column.hide = !!column.hide;
      column.disabledHide = column.fixed !== undefined;
      return column;
    }) || [];
}

const cpBaseTable = ref();
const topActions = ref();
const pagination = ref();
// 自动检测表格高度，已废弃
// function updateTableHeight() {
//   nextTick(() => {
//     const cpBaseTableDiv = cpBaseTable.value;
//     const nodeStyle = window.getComputedStyle(cpBaseTableDiv, null);
//     const nodePaddingTop = parseFloat(nodeStyle.paddingTop);
//     const nodePaddingBottom = parseFloat(nodeStyle.paddingBottom);
//     const nodeHeight = parseFloat(nodeStyle.height);
//     let resultHeight = nodeHeight - nodePaddingTop - nodePaddingBottom;
//     // 减去top-actions高度
//     if (showToActions) {
//       const topActionsDiv = topActions.value;
//       if (topActionsDiv) {
//         const topActionsStyle = window.getComputedStyle(topActionsDiv, null);
//         const topActionsHeight =
//           parseFloat(topActionsStyle.height) +
//           parseFloat(topActionsStyle.marginBottom);
//         resultHeight -= topActionsHeight;
//       }
//     }
//     // 减去pagination高度
//     if (props.usePagination) {
//       const paginationDiv = pagination.value;
//       if (paginationDiv) {
//         const paginationStyle = window.getComputedStyle(paginationDiv, null);
//         const paginationHeight =
//           parseFloat(paginationStyle.height) +
//           parseFloat(paginationStyle.marginTop);
//         resultHeight -= paginationHeight;
//       }
//     }
//     state.tableHeight = resultHeight >= 0 ? resultHeight : 0;
//   });
// }

// 自定义表头样式
function columnHeaderStyle(columnItem: any) {
  const defaultStyle = {};
  if (
    columnItem.headerStyles &&
    typeof columnItem.headerStyles === "function"
  ) {
    Object.assign(defaultStyle, columnItem.headerStyles(columnItem));
  }
  return defaultStyle;
}

// 自定义每一列样式
function columnStyles(columnItem: any, row: any) {
  // 当前行的列值
  const columnValue = row[columnItem.prop];
  // 最终的样式
  const style: styleType = {};
  // 自动让包含"时间"的列进行空格换行
  if (columnItem.label.includes("时间")) {
    style.wordBreak = "normal";
  }
  // 支持color快捷配置
  if (columnValue && columnValue !== 0) {
    style.color = columnItem.color;
  }
  // 单行省略(这个功能element自带也能实现，会比这个好，因为这个是一直出现)
  if (columnItem.ellipsis) {
    style.textOverflow = "ellipsis";
    style.whiteSpace = "nowrap";
    style.overflow = "hidden";
  }
  // 字典翻译
  if (columnItem.dictKey && typeof columnItem.dictKey === "string") {
    const translate = dictTranslate(columnItem.dictKey, columnValue);
    if (translate) {
      Object.assign(style, translate.style);
    }
  }
  // 自定义styles函数， 参数传入： 当前值、当前行、所有行
  if (columnItem.styles && typeof columnItem.styles === "function") {
    Object.assign(style, columnItem.styles(columnValue, row, props.data));
  }
  return style;
}

// 每一列的数值
function columnValueShow(columnItem: BaseTableColumn<RowType>, row: RowType, index?: number): string {
  // 当前行的列值
  const columnValue = row[columnItem.prop];
  // 计算值
  let valueShow: string | number = columnValue;
  // 字典翻译
  if (columnItem.dictKey && typeof columnItem.dictKey === "string") {
    const translate = dictTranslate(columnItem.dictKey, columnValue);
    if (translate) {
      valueShow = translate.text;
    }
  }
  // 自动分页序号
  if (columnItem.prop === "$autoPageIndex") {
    let current = 1;
    let size = 10;
    if (props.usePagination) {
      current = props.pagination.current || 1;
      size = props.pagination.size || 10;
      valueShow = index! + 1 + (current - 1) * size;
    } else {
      valueShow = index ? index + 1 : 1;
    }
  }
  // 自定义formatter函数, 参数传入： 当前值、当前行、所有行
  if (columnItem.formatter && typeof columnItem.formatter === "function") {
    valueShow = columnItem.formatter(columnValue, row, props.data);
  }
  return formatEmpty(valueShow);
}

// 统一的空值处理
function formatEmpty(value: any) {
  if (typeof value === "number") {
    if (props.notZeroNumber) {
      return value === 0 ? "- -" : value;
    }
    return value?.toString();
  } else {
    return value?.toString() || "- -";
  }
}

const emit = defineEmits<{
  // 多选变化
  (e: "selection-change", selection: any): void;
  // 全选
  (e: "select-all", selection: any): void;
  // 单行选择变化
  (e: "select", selection: any, row: any): void;
  // 点击刷新
  (e: "refresh");
  //页数
  (e: "current-change", index: number);
  // 页码
  (e: "size-change", index: number);
  // 行点击
  (e: "row-click", row: any): void;
}>();

// 多选变化
const handleSelectionChange = (selection: RowType[]) => {
  emit("selection-change", selection);
};
// 全选
const selectAll = (selection: RowType[]) => {
  emit("select-all", selection);
};
// 单行选择变化
const handleSelect = (selection: RowType[], row: RowType) => {
  emit("select", selection, row);
};
// toggleRowSelection暴露
const table = ref();
const toggleRowSelection = (row: RowType, selected: boolean) => {
  table.value?.toggleRowSelection(row, selected);
};
// clearSelection暴露
const clearSelection = () => {
  table.value?.clearSelection();
};
// setCurrentRow暴露(设置高亮)
const setCurrentRow = (row: RowType) => {
  table.value?.setCurrentRow(row);
};
const clickRefresh = () => {
  emit("refresh");
};

const rowClick = (row: RowType) => {
  emit("row-click", row);
};
const tableConfiguration = ref();
const clickTableConfiguration = () => {
  state.showTableConfiguration = true;
  tableConfiguration.value?.toggle();
};

const changeHide = () => {
  state.internalColumns = [...state.internalColumns];
};

defineExpose({
  toggleRowSelection,
  clearSelection,
  setCurrentRow,
});

watch(
  () => props.columns,
  () => {
    updateInternalColumns();
  }
);
</script>
<style lang="scss">
@import "./style";
</style>
<style lang="scss" scoped>
.cpBaseTable {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .table-box {
    flex: 1;
    overflow: hidden;
  }
  :deep(.el-table-column--selection .cell) {
    padding-right: 0;
    padding-left: 10px;
  }
  .topActions {
    &[data-reverse="true"] {
      flex-direction: row-reverse;
    }
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 10px;
    .tableTool {
      display: flex;
      align-items: center;
    }
    .custom-top-actions {
      display: flex;
      align-items: center;
    }
  }
  .table {
    width: 100%;
  }
  .textOverflow {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block !important;
  }
  .pagination {
    display: flex;
    align-items: center;
    margin-top: 15px;
  }
}
// :deep(.el-table td div){
//   display: flex;
// }
</style>
<style lang="scss">
.el-tooltip__popper {
  max-width: 30vw;
}
.tooltip-width {
  max-width: 30vw !important;
}
:deep(.el-tooltip__popper) {
  width: 30vw !important;
}
</style>
