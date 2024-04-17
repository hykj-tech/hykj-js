/**
 * 组件状态
 */
export type BaseTableSate ={
  tableHeight: number;
  internalSelection: [];
  showTableConfiguration: boolean
  internalColumns: any[]
  delayMounted:boolean
}

export type BaseTableProps = {
  // 是否使用teleported
  teleported?: boolean;
   // 表格是否实现高亮
  hightCurrentRow?: boolean;
  // 使用表格自带的功能按钮
  useTableTool?: boolean;
  // 分页组件对齐, justify-content内容
  paginationJustify?: string;
   // 分页相关参数绑定，需以对象直接传入, 分别为sizes,layout,total,current,size
  pagination?: {
    sizes?: number[];
    layout?: string;
    total?: number;
    current?: number;
    size?: number;
  };
  // 启用分页组件
  usePagination?: boolean;
    // 通el-table-column的selectable属性，只是这里统一放在selection的列中
  selectable?: (row: any, index: number) => boolean;
 // 同el-table的row-key, 放在tableOptions中使用也是可以的
  rowKey?: string;
  // 是否开启行选择
  useSelection?: boolean;
// el-table对于type=selection的列的reserve-selection功能
  useReserveSelection?: boolean;
  // 是否开始自动高度适应以固定表头(这个功能要求组件容器（cp-base-table）有确切的高度)
  autoHeight?: boolean;
  // 固定高度，同tableOptions中的{height:xxx},若使用，将不会运用autoHeight
  height?: boolean;
  // 数字0是否被视为空值
  notZeroNumber?: boolean;
   // 自定义列，columns代表每一列的定义，都使用el-table-column的参数定义
  // 同时支持color，tooltip，formatter，styles，ellipsis几种功能 
  columns?: BaseColumnProps[]; 
   // 全局的列对齐
  columnAlign?: string;
 // 解构el-table的所有属性
  tableOptions?: any;
  
  data?: any[];
  // loading动画
  loading?: boolean;
   // topActions布局反向
  topActionsReverse?: boolean;
  treeProps?: boolean;
 // 用于判断表格是否展开子元素
  showTdChildren?: boolean;
  // 指定展开哪一个
  openKey?: string[] ; 
};

export type BaseColumnProps = {
  prop: string;
  label: string;
  dictKey?: string;
  styles?: (value: any, row: any, allData: any[]) => Record<string, string>;
  formatter?: (value: any, row: any, allData: any[]) => any;
  [key:string]: any
}


export type styleType = {
  wordBreak?: string;
  color?: string;
  textOverflow?: string;
  whiteSpace?: string;
  overflow?: string;
};
// export type columnItemType = {
//   prop?: string;
//   label?: string;
//   color?: string;
//   ellipsis?: boolean;
//   dictKey?: string;
//   styles?: (value: any, row: any, allData: any[]) => cType;
//   headerStyles?: (columnItem: columnItemType) => cType;
// };
