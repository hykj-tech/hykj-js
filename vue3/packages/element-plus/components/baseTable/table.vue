<template>
  <div class="cp-base-table" ref="cp-base-table">
    <!--    表格上部分操作栏-->
    <div class="topActions" :data-reverse="topActionsReverse" v-if="showToActions" ref="top-actions">
      <div class="custom-top-actions">
        <!--        操作栏自定义插槽-->
        <slot name="top-actions"></slot>
      </div>
      <div style="flex-grow: 1"></div>
      <!--      操作栏自带的表格工具-->
      <div class="tableTool" v-if="useTableTool">
        <!--        刷新-->
        <el-button :icon="Refresh" size="small" circle @click="clickRefresh"></el-button>
        <!--        表格配置-->
        <el-button :icon="Operation" size="small" circle @click="clickTableConfiguration"></el-button>
      </div>
    </div>
    <div class="table-box">
    <!--    主表格渲染-->
    <el-table
        v-loading="loading"
        ref="table"
        class="table"
        :data="data"
        :row-key="rowKey"
        :default-expand-all="showTdChildren"
        :expand-row-keys="openKey"
        @selection-change="handleSelectionChange"
        :tree-props="treeProps || {children: 'children'}"
        @select="handleSelect"
        @select-all="selectAll"
        @row-click="rowClick"
        v-bind="tableOptionsToUse"
        height="100%"
    >
      <!-- 行选中功能 -->
      <el-table-column
          v-if="useSelection"
          :selectable="selectable"
          :reserve-selection="useReserveSelection"
          type="selection"
      ></el-table-column>
      <!-- 自定义列 -->
      <el-table-column
          v-for="(column, columnIndex) of finalColumns"
          :key="column.prop + columnIndex"
          v-bind="column"
          :align="column.align ? column.align : (columnAlign || 'left')"
      >
        <!-- 自定义表头 -->
        <template
            v-slot:header="scope"
        >
          <slot
              v-if="$slots[`header.${column.prop}`]"
              :name="`header.${column.prop}`"
              :column="scope.column"
          ></slot>
          <div v-else :style="{...columnHeaderStyle(column)}">{{ column.label }}</div>
        </template>
        <template v-slot="scope">
          <!-- 支持tooltip配置 -->
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
                :row="scope.row"
                :index="scope.$index + 1"
                :value="scope.row[column.prop]"
                :valueShow="columnValueShow(column, scope.row, scope.$index)"
            ></slot>
            <!--          默认渲染-->
            <div style="display: inline-block" :class="{textOverflow:column['show-overflow-tooltip']}" v-else :style="{...columnStyles(column, scope.row)}">
              {{ columnValueShow(column, scope.row, scope.$index) }}
            </div>

          </el-tooltip>
        </template>
      </el-table-column>
      <!-- 使用其他el-table原生方式扩展 -->
      <slot></slot>
    </el-table>
    </div>
    <div class="pagination" :style="{justifyContent : paginationJustify}" v-if="usePagination" ref="pagination">
      <el-pagination
          background
          @size-change="$emit('size-change', $event)"
          @current-change="$emit('current-change', $event)"
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="pagination.sizes || [10 , 25 , 50 , 100]"
          :layout="pagination.layout || 'total, sizes, prev, pager, next, jumper'"
          :total="pagination.total || 0">
      </el-pagination>
    </div>
    <tableConfiguration v-if="useTableTool && delayMounted" ref="tableConfiguration" @change="changeHide" :columnsData="internalColumns"></tableConfiguration>
  </div>
</template>

<script setup>
import {
  Refresh,
  Operation
} from '@element-plus/icons-vue'
</script>

<script>
import { dictTranslate } from '@hykj-js/vue3-hooks';
export default {
  components: {
    tableConfiguration: defineAsyncComponent(() => import('./tableConfiguration.vue')),
  },
  data() {
    return {
      // 自动高度
      tableHeight: 0,
      // 选中数据
      internalSelection: [],
      showTableConfiguration: false,
      // 内部处理的columns数据
      internalColumns: [],
      delayMounted: false,
    };
  },
  computed: {
    // 最终渲染的列
    finalColumns() {
      return this.internalColumns
          // 一些属性的转换
          .map(column => {
            if (column['showOverflowTooltip']  || column['overflowTooltip']){
              column['show-overflow-tooltip'] = true;
            }
            return column;
          })
          // 通过columns中的hide属性来判断是否显示
          .filter(column => {
            column.show = !column.hide;
            // 如果column对象已经设置了fixed，那么用户无法自定义配置显示
            if (column.fixed !== undefined) {
              column.disabledHide = true;
              return true;
            } else {
              return !column.hide;
            }
          });
    },
    // 是否显示topActions
    showToActions() {
      return this.useTableTool || this.$slots['top-actions'];
    },
    // 表格组件的父容器
    tableParent() {
      const cpBaseTableDiv = this.$refs['cp-base-table'];
      return cpBaseTableDiv?.parentNode;
    },
    // el-table最终使用的属性
    tableOptionsToUse() {
      const defaultOption = {
        // 20230823 按照UI规范，目前默认false
        border: false,
      };
      const otherOptionProps = {
        // 默认表头样式
        'header-cell-class-name': 'baseTable-commonHeaderRow',
        // 默认表格尺寸
        size: 'small'
      };
      if (this.height) {
        Object.assign(defaultOption, {
          height: this.height
        });
      }
      const ignoreAutoHeight = !!(this.height || this.tableOptions.height);
      // 自动高度
      if (this.autoHeight && this.tableHeight && !ignoreAutoHeight) {
        otherOptionProps.height = this.tableHeight;
      }
      // rowKey设置
      if (this.rowKey) {
        otherOptionProps['row-key'] = this.rowKey;
      }
      // const result = Object.assign(defaultOption,  otherOptionProps,this.tableOptions);
      // console.log(result);
      return Object.assign(defaultOption, otherOptionProps,this.tableOptions);
    }
  },
  mounted() {
    setTimeout(()=>{
      this.delayMounted = true;
    },1000)
    this.updateInternalColumns();
    // this.updateTableHeight();
    // if (ResizeObserver) {
    //   this.containerResizeObserver = new ResizeObserver(() => {
    //     this.updateTableHeight();
    //   });
    //   this.containerResizeObserver.observe(this.$refs['cp-base-table']);
    // } else {
    //   window.addEventListener('resize', this.updateTableHeight);
    // }
  },
  beforeDestroy() {
    // if (this.containerResizeObserver) {
    //   this.containerResizeObserver.disconnect();
    // } else {
    //   window.removeEventListener('resize', this.updateTableHeight);
    // }
  },
  methods: {
    // 更新内部columns
    updateInternalColumns() {
      this.internalColumns = this.columns.map(column => {
        column.hide = !!column.hide;
        column.disabledHide = column.fixed !== undefined;
        return column;
      }) || [];
    },
    // 自动检测表格高度
    updateTableHeight() {
      this.$nextTick(() => {
        const cpBaseTableDiv = this.$refs['cp-base-table'];
        const nodeStyle = window.getComputedStyle(cpBaseTableDiv, null);
        const nodePaddingTop = parseFloat(nodeStyle.paddingTop);
        const nodePaddingBottom = parseFloat(nodeStyle.paddingBottom);
        const nodeHeight = parseFloat(nodeStyle.height);
        let resultHeight = nodeHeight - nodePaddingTop - nodePaddingBottom;
        // 减去top-actions高度
        if (this.showToActions) {
          const topActionsDiv = this.$refs['top-actions'];
          if (topActionsDiv) {
            const topActionsStyle = window.getComputedStyle(topActionsDiv, null);
            const topActionsHeight = parseFloat(topActionsStyle.height) + parseFloat(topActionsStyle.marginBottom);
            resultHeight -= topActionsHeight;
          }
        }
        // 减去pagination高度
        if (this.usePagination) {
          const paginationDiv = this.$refs['pagination'];
          if (paginationDiv) {
            const paginationStyle = window.getComputedStyle(paginationDiv, null);
            const paginationHeight = parseFloat(paginationStyle.height) + parseFloat(paginationStyle.marginTop);
            resultHeight -= paginationHeight;
          }
        }
        this.tableHeight = resultHeight >= 0 ? resultHeight : 0;
      });
    },
    // 自定义表头样式
    columnHeaderStyle(columnItem) {
      const defaultStyle = {};
      if (columnItem.headerStyles && typeof columnItem.headerStyles === 'function') {
        Object.assign(defaultStyle, columnItem.headerStyles(columnItem));
      }
      return defaultStyle;
    },
    // 自定义每一列样式
    columnStyles(columnItem, row) {
      // 当前行的列值
      const columnValue = row[columnItem.prop];
      // 最终的样式
      const style = {};
      // 自动让包含"时间"的列进行空格换行
      if (columnItem.label.includes('时间')) {
        style.wordBreak = 'normal';
      }
      // 支持color快捷配置
      if (columnValue && columnValue !== 0) {
        style.color = columnItem.color;
      }
      // 单行省略(这个功能element自带也能实现，会比这个好，因为这个是一直出现)
      if (columnItem.ellipsis) {
        style.textOverflow = 'ellipsis';
        style.whiteSpace = 'nowrap';
        style.overflow = 'hidden';
      }
      // 字典翻译
      if (columnItem.dictKey && typeof columnItem.dictKey === 'string') {
        const translate = dictTranslate(columnItem.dictKey, columnValue);
        if (translate) {
          Object.assign(style, translate.style);
        }
      }
      // 自定义styles函数， 参数传入： 当前值、当前行、所有行
      if (columnItem.styles && typeof columnItem.styles === 'function') {
        Object.assign(style, columnItem.styles(columnValue, row, this.data));
      }
      return style;
    },
    // 每一列的数值
    columnValueShow(columnItem, row, $index) {
      // 当前行的列值
      const columnValue = row[columnItem.prop];
      // 计算值
      let valueShow = columnValue;
      // 字典翻译
      if (columnItem.dictKey && typeof columnItem.dictKey === 'string') {
        const translate = dictTranslate(columnItem.dictKey, columnValue);
        if (translate) {
          valueShow = translate.text;
        }
      }
      // 自动分页序号
      if(columnItem.prop === '$autoPageIndex') {
        let current = 1;
        let size = 10;
        if(this.usePagination ){
          current = this.pagination.current || 1;
          size = this.pagination.size || 10
          valueShow = $index  + 1 + (current - 1) * size;
        }else{
          valueShow = $index + 1
        }
      }
      // 自定义formatter函数, 参数传入： 当前值、当前行、所有行
      if (columnItem.formatter && typeof columnItem.formatter === 'function') {
        valueShow = columnItem.formatter(columnValue, row, this.data );
      }
      return this.formatEmpty(valueShow);
    },
    // 统一的空值处理
    formatEmpty(value) {
      if (typeof value === 'number') {
        if (this.notZeroNumber) {
          return value === 0 ? '- -' : value;
        }
        return value?.toString();
      } else {
        return value?.toString() || '- -';
      }
    },
    // 多选变化
    handleSelectionChange(selection) {
      this.$emit('selection-change', selection);
    },
    // 全选
    selectAll(selection) {
      this.$emit('select-all', selection);
    },
    // 单行选择变化
    handleSelect(selection, row) {
      this.$emit('select', selection, row);
    },
    // toggleRowSelection暴露
    toggleRowSelection(row, selected) {
      this.$refs.table.toggleRowSelection(row, selected);
    },
    // clearSelection暴露
    clearSelection() {
      this.$refs.table.clearSelection();
    },
    clickRefresh() {
      this.$emit('refresh');
    },
    rowClick(row){
      this.$emit('row-click' , row);
    },
    clickTableConfiguration() {
      this.showTableConfiguration = true;
      this.$refs.tableConfiguration?.toggle();
    },
    changeHide() {
      this.internalColumns = [...this.internalColumns];
    }
  },
  expose: ['toggleRowSelection','clearSelection'],
  watch: {
    columns() {
      this.updateInternalColumns();
    },
  },
  props: {
    // 使用表格自带的功能按钮
    useTableTool: {
      type: Boolean,
      default: false
    },
    // 分页组件对齐, justify-content内容
    paginationJustify: {
      type: String,
      default: 'flex-end'
    },
    // 分页相关参数绑定，需以对象直接传入, 分别为sizes,layout,total,current,size
    pagination: {
      type: Object,
      default: () => {
        return {
          sizes: [10, 25, 50, 100],
          layout: 'total, sizes, prev, pager, next, jumper',
          total: 0,
          current: 1,
          size: 10
        };
      }
    },
    // 启用分页组件
    usePagination: {
      type: Boolean,
      default: false,
    },
    // 通el-table-column的selectable属性，只是这里统一放在selection的列中
    selectable: {
      type: Function,
      default: () => {
        return true;
      }
    },
    // 同el-table的row-key, 放在tableOptions中使用也是可以的
    rowKey: {
      type: String,
      default: ''
    },
    // 是否开启行选择
    useSelection: {
      type: Boolean,
      default: false
    },
    // el-table对于type=selection的列的reserve-selection功能
    useReserveSelection: {
      type: Boolean,
      default: false
    },
    // 是否开始自动高度适应以固定表头(这个功能要求组件容器（cp-base-table）有确切的高度)
    autoHeight: {
      type: Boolean,
      default: true
    },
    // 固定高度，同tableOptions中的{height:xxx},若使用，将不会运用autoHeight
    height: {
      type: Number,
    },
    // 数字0是否被视为空值
    notZeroNumber: {
      type: Boolean,
      default: false
    },
    // 自定义列，columns代表每一列的定义，都使用el-table-column的参数定义
    // 同时支持color，tooltip，formatter，styles，ellipsis几种功能
    columns: {
      type: Array,
      default: () => []
    },
    // 全局的列对齐
    columnAlign:{
      type: String
    },
    // 解构el-table的所有属性
    tableOptions: {
      type: Object,
      default: () => ({})
    },
    data: {
      type: Array,
      default: () => []
    },
    // loading动画
    loading: {
      type: Boolean,
      default: false
    },
    // topActions布局反向
    topActionsReverse: {
      type: Boolean,
      default: false
    },
    treeProps:{
      type: Object,
    },
    // 用于判断表格是否展开子元素
    showTdChildren:{
      type:Boolean,
      default:false
    },
    // 指定展开哪一个
    openKey:{
      type:Array,
    },
  }
};
</script>
<style lang="scss">
@import './style';
</style>
<style lang="scss" scoped>
.cp-base-table {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .table-box{
    flex:1;
    overflow: hidden;
  }
  :deep(.el-table-column--selection .cell) {
    padding-right: 0;
    padding-left: 10px;
  }
  .topActions {
    &[data-reverse="true"]{
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
  .textOverflow{
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pagination {
    display: flex;
    align-items: center;
    margin-top: 15px;
  }
}
:deep(.el-table td div){
  display: flex;
}
</style>
<style lang="scss">
.el-tooltip__popper {
  max-width: 30vw;
}
.tooltip-width {
  max-width: 30vw !important;
}
:deep(.el-tooltip__popper){
  width: 30vw !important;
}
</style>
