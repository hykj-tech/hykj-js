/**
 * 组件状态
 */
export type BaseTableSate ={
  tableHeight: number;
  internalSelection: [];
  showTableConfiguration: boolean
  internalColumns: BaseTableColumn[]
  delayMounted:boolean
}

export type BaseTablePagination = {
  sizes?: number[];
  layout?: string;
  total?: number;
  current?: number;
  size?: number;
}

export type BaseTableProps = {
  /**
   * 是否使用teleported
   */ 
  teleported?: boolean;
   /**
    * 表格是否实现高亮
    */
  hightCurrentRow?: boolean;
  /**
   * 使用表格自带的功能按钮
   */
  useTableTool?: boolean;
  /**
   * 分页组件对齐, justify-content内容
   */
  paginationJustify?: string;
   /**
    * 分页相关参数绑定，需以对象直接传入, 分别为sizes,layout,total,current,size
    * 内部会向外部更新current和size
    */
  pagination?: BaseTablePagination;
  /**
   * 启用分页组件
   */
  usePagination?: boolean;
  /**
   * 通el-table-column的selectable属性，只是这里统一放在selection的列中
   * @param row 
   * @param index 
   * @returns 
   */
  selectable?: (row: any, index: number) => boolean;
 /**
  * 同el-table的row-key, 放在tableOptions中使用也是可以的
  */
  rowKey?: string;
  /**
   * 是否开启行选择
   */
  useSelection?: boolean;
/**
 * el-table对于type=selection的列的reserve-selection功能
 */
  useReserveSelection?: boolean;
  /**
   * （废弃,应通过布局控制cpBaseTable）是否开始自动高度适应以固定表头(这个功能要求组件容器（cp-base-table）有确切的高度)
   */
  autoHeight?: boolean;
  /**
   * （废弃，不建议自行定义高度,应通过布局控制cpBaseTable）固定高度，同tableOptions中的{height:xxx},若使用，将不会运用autoHeight
   */
  height?: boolean;
  /**
   * 数字0是否被视为空值
   */
  notZeroNumber?: boolean;
  /**
   * 自定义列，columns代表每一列的定义，都使用el-table-column的参数定义
   * 同时支持字典翻译，color，tooltip，formatter，styles，ellipsis几种功能 
   */
  columns?: BaseTableColumn[]; 
   /**
    * 全局的列对齐
    */
  columnAlign?: string;
  /**
   * el-table的其他属性，如border,stripe，底部统计等
   */
  tableOptions?: Record<string, any>;
  /**
   * 列表数据状态
   */ 
  data?: any[];
  /**
   * loading动画
   */
  loading?: boolean;
   /**
    * topActions布局反向
    */
  topActionsReverse?: boolean;
  /**
   * el-table的树形列表属性
   */
  treeProps?: boolean;
 /**
  * 用于判断表格是否展开子元素
  */
  showTdChildren?: boolean;
  /**
   * 树形列表指定展开哪一个
   */
  openKey?: string[] ; 
};

/**
 * 表格列的基本渲染定义
 */
export type BaseTableColumn<RowType = Record<string, any>> = {
  /**
   * 列的字段名
   */
  prop?: string;
  /**
   * 表头列名
   */
  label?: string;
  /**
   * 字典映射（dictTranslate工具集成）
   */
  dictKey?: string;
  /**
   * 自定义样式
   * @param value 
   * @param row 
   * @param allData 
   * @returns 
   */
  styles?: (value: any, row: RowType, allData: RowType[]) => Record<string, string>;
  /**
   * 表格单元格自定义格式化
   * @param value 
   * @param row 
   * @param allData 
   * @returns 
   */
  formatter?: (value: any, row: RowType, allData: RowType[]) => any;
  /**
   * 最常用的自动单行省略
   */
  'show-overflow-tooltip'?: boolean,
  /**
   * 直接定义文字颜色
   */
  color?: string,
  /**
   * 单元格对齐方式 
   */
  align?: string,
  /**
   * 单元格宽度
   */
  width?: number | string 
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
