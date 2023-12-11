import {reactive} from "vue";
import {useDebounceFn} from "@vueuse/core";
import {structureClone} from "@hykj-js/shared";

type ListPagination = {
  // 可用于el-pagination的布局参数
  layout?: string,
  // el-pagination的sizes参数
  sizes?: string[] | number[],
  // 当前页数
  current?: number,
  // 当前页大小
  size: number,
  // 列表总数
  total?: number
}

type FetchFuncResult<RowType = any> =  {
  list: RowType[],
  total: number
}

export type UseCommonListOptions<RowType = any> = {
  // 初始的查询参数对象，这里不再做过多类型处理，外部需要传输响应式数据，这里只做重置query的记录拦截
  query: any,
  // 更新列表的方法
  fetchFunc?: () => Promise<FetchFuncResult<RowType> | [RowType[], number] >,
  // 初始的分页参数定义
  pagination?: ListPagination,
  // 当前行数据Key
  rowIdKey?: string,
}

type LoadDataOptions = {
  loading?: boolean
}

export const useCommonList = <RowType>(
  options: UseCommonListOptions<RowType>
) => {
  // 当前行数据Key
  // const rowIdKey = ref(options.rowIdKey || 'id');
  // 列表状态
  const state = reactive({
    // 列表加载
    loading: false,
    // 列表数据
    list: [] as RowType[],
    // 当前数据行
    rowNow: null as RowType | null | undefined,
  })
  // 分页参数
  const pagination = reactive(Object.assign({
    layout: 'total, sizes, prev, pager, next, jumper',
    sizes: [10, 25, 50, 100],
    current: 1,
    size: 10,
    total: 0,
  }, options.pagination))
  const fetchFunc = options.fetchFunc;
  // const deleteFunc = options.deleteFunc;
  let loadDataLock: string | number = '';
  const defaultQuery = structureClone(options.query);

  /**
   * 更新列表
   * @param options
   */
  async function loadData(options?: LoadDataOptions & Event) {
    let l: RowType[] = [];
    let t = 0;
    loadDataLock = new Date().getTime()?.toString();
    const lockNow = loadDataLock;
    const loadDataOptions = options || {loading: true}
    try {
      if (loadDataOptions.loading !== false) {
        state.loading = true;
      }
      // 使用固定的this.fetchList方法, 要求返回{list,total} 或者 [list,total]
      if (fetchFunc && fetchFunc instanceof Function) {
        const fetchFuncResult= await fetchFunc() || {};
        let s
        if(fetchFuncResult instanceof Array && fetchFuncResult.length === 2){
          s = fetchFuncResult as [RowType[], number];
          l = fetchFuncResult[0] || [];
          t = fetchFuncResult[1] || 0;
        }else{
          s = fetchFuncResult as FetchFuncResult<RowType>;
          l = s.list || [];
          t = s.total || 0;
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      if (lockNow === loadDataLock) {
        state.list = l as any;
        pagination.total = t;
        state.loading = false;
      }
    }
  }

  /**
   * 重置分页，这个函数不对外开放
   */
  function resetPagination() {
    pagination.current = 1;
    pagination.total = 0;
  }

  interface changeQueryOptions {
    // 去抖
    debounce?: number
  }

  /**
   * 搜索发生变化
   * @param {changeQueryOptions} [options] 可选功能参数
   * @returns {Promise<void>}
   */
  async function changeQuery(options?: changeQueryOptions) {
    // 可选去抖
    if (options?.debounce) {
      const debounceTime = Number(options?.debounce) || 500;
      const debounceFn = useDebounceFn(async () => {
          resetPagination();
          await loadData();
        },
        debounceTime)
      await debounceFn();
      return;
    }
    resetPagination();
    await loadData();
  }

  // 重置搜索条件
  function resetQuery() {
    if(options?.query){
      // 针对defaultQuery逐个字段赋值更新
      Object.keys(defaultQuery).forEach(key => {
        options.query[key] = defaultQuery[key];
      })
    }
    pagination.current = 1;
    pagination.total = 0;
  }

  // 开放一个方法，可以动态修改defaultQuery
  function updateDefaultQuery(query:Object){
    Object.keys(query).forEach(key => {
      defaultQuery[key] = query[key as keyof typeof query];
    })
  }

  // 重置页面（重置搜索条件并清空列表重新加载）
  async function resetPage() {
    state.list = [];
    resetQuery();
    await loadData();
  }

  // 重置分页并加载
  async function resetPaginationAndLoad() {
    resetPagination();
    await loadData();
  }

  // 更新当前数据行
  function setRowNow(row: any) {
    state.rowNow = row;
  }


  return {
    state,
    pagination,
    loadData,
    changeQuery,
    resetQuery,
    resetPage,
    resetPaginationAndLoad,
    setRowNow,
    updateDefaultQuery
  }
}





