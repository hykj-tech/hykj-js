import type { UseCommonListOptions } from "@hykj-js/vue3-hooks"
import { useCommonList } from "@hykj-js/vue3-hooks"
import {loadingConfirm} from "../commonUtils";
import {ElMessage} from "element-plus";

type UseListOptions<RowType = any> = {
  /**
   *  具体的删除方法
   */
  deleteFunc?: (row: RowType) => Promise<void>,
  /**
   * 当前行数据标题的Key, 默认为name
   */
  rowTitleKey?: string,
} & UseCommonListOptions<RowType>

const defaultRowTitleKey = 'name'

/**
 * 通用列表组合API，对useCommonList进行的封装，额外支持deleteRow方法
 */
export function useList<RowType>(options: UseListOptions<RowType>){
  const { deleteFunc } = options
  const useCommonListApi = useCommonList<RowType>(options)

  // 删除行方法，直接提供loadingConfirm
  const deleteRow = async (row: RowType)=>{
    useCommonListApi.setRowNow(row)
    const titleKey = options?.rowTitleKey || defaultRowTitleKey
    const rowTitle = row[titleKey] || '';
    const objName = rowTitle? `"${rowTitle}"` : '';
    const message = `
        <span>数据</span><span style="color: red">${objName}</span><span>将被删除，是否继续？</span>
      `;
    await loadingConfirm({
        type: 'warning',
        title: '删除确认',
        message,
        html:true,
        loadingText: '正在删除...',
      },
      async () => {
        try {
          // 使用deleteFunc进行删除
          if( deleteFunc instanceof Function ){
            await  deleteFunc(row);
          }
          ElMessage.success('删除成功');
          await useCommonListApi.loadData();
          useCommonListApi.setRowNow(null);
        } catch (e) {
          console.log(e);
        }
      }).catch(() => {})
  }
  return {
    ...useCommonListApi,
    deleteRow,
  }
}
