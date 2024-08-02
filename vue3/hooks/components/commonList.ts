import {UnwrapNestedRefs, computed, isReactive, reactive, ref, toRaw} from "vue-demi";
import {useDebounceFn} from "@vueuse/core";
import {structuredClone} from "@hykj-js/shared";

type ListPagination = {
  // 当前页大小
  size: number,
  // 当前页数
  current: number,
  // 列表总数
  total: number
  // el-pagination预设支持
  layout: string,
  sizes: number[]
}

type UseCommonListPaginationDefine = {
  size?: number,
  layout?: string,
  current?: number,
  sizes?: number[]
}

export interface changeQueryOptions {
  // 去抖
  debounce?: number
}

export type FetchFuncResult<RowType = any> =  {
  list: RowType[],
  total: number,
  // 显式返回的错误
  err?: any
}

export type FetchFuncResultTuple<RowType = any> =  [RowType[], number] | [RowType[], number, any]

// 列表方法会携带的参数
export type FetchFuncParams<RowType = any> = {
  pagination: {
    size: number,
    current: number
  },
  list: RowType[],
  total: number
}

export type CommonListQuery = Record<string, any> | UnwrapNestedRefs<Record<string, any>>

// 主API的配置
export type UseCommonListOptions<RowType = any> = {
  // 初始的查询参数对象，这里不再做过多类型处理，外部需要传输响应式数据，这里只做重置query的记录拦截
  query: CommonListQuery,
  // 更新列表的方法
  fetchFunc?: (params?: FetchFuncParams<RowType>) => Promise<FetchFuncResult<RowType> | FetchFuncResultTuple<RowType> >,
  // 初始的分页参数定义
  pagination?: UseCommonListPaginationDefine,
  // 当前行数据Key,默认为id
  rowIdKey?: string,
  // 使用concat模式，实现瀑布流加载
  useConcat?: boolean,
}

type LoadDataOptions = {
  loading?: boolean,
  resetConcat?: boolean,
}

export const useCommonList = <RowType>(
  options: UseCommonListOptions<RowType>
) => {
  // 当前行数据Key
  const rowIdKey = ref(options.rowIdKey || 'id');
  // 是否使用瀑布流模式
  const useConcat = ref(options.useConcat || false);
  // 列表状态
  const state = reactive({
    // 列表加载
    loading: false,
    // 列表数据
    list: [] as RowType[],
    // 当前数据行
    rowNow: null as RowType | null | undefined,
  })
  // 分页数据储存
  const pagination = reactive<ListPagination>(Object.assign({
    // 预设适配el-table的分页参数
    layout: 'total, sizes, prev, pager, next, jumper',
    sizes: [10, 25, 50, 100],
    current: 1,
    size: 10,
    total: 0,
  }, options.pagination))
  const fetchFunc = options.fetchFunc;
  let loadDataLock: string | number = '';
  let defaultQuery: Record<any, any>
  if(isReactive(options.query)){
    defaultQuery = structuredClone(toRaw(options.query));
  }else{
    defaultQuery = structuredClone(options.query);
  }


  // 当前分页最大页数
  const maxPage = computed(()=>Math.ceil(pagination.total / pagination.size));
  // 是否还有下一页
  const hasNextPage = computed(()=>pagination.current < maxPage.value);

  /**
   * 更新列表
   * @param options
   */
  async function loadData(options?: LoadDataOptions & Partial<Event>) {
    let l: RowType[] = [];
    let t = 0;
    let hasErr = false;
    loadDataLock = new Date().getTime()?.toString();
    const lockNow = loadDataLock;
    const loadDataOptions = options || {loading: true}
    try {
      if (loadDataOptions.loading !== false) {
        state.loading = true;
      }
      // 使用固定的this.fetchList方法, 要求返回{list,total, err} 或者 [list,total, err]
      if (fetchFunc && fetchFunc instanceof Function) {
        const fetchFuncResult= await fetchFunc({
          pagination: {
            size: pagination.size,
            current: pagination.current
          },
          list: state.list as RowType[],
          total: pagination.total
        }) || {};
        let s
        let e 
        if(fetchFuncResult instanceof Array && fetchFuncResult.length >= 2){
          s = fetchFuncResult as FetchFuncResultTuple<RowType>;
          l = fetchFuncResult[0] || [];
          t = fetchFuncResult[1] || 0;
          e = fetchFuncResult[2] || null;
        }else{
          s = fetchFuncResult as FetchFuncResult<RowType>;
          l = s.list || [];
          t = s.total || 0;
          e = s.err || null;
        }
        if(e) hasErr = true
      }
    } catch (e) {
      console.error(e);
      hasErr = true;
    } finally {
      if (lockNow === loadDataLock) {
        // 只有无错误时才进行状态更新
        if(!hasErr){
          pagination.total = t;
          // 如果当前时瀑布流模式 使用concat, 并需要根据rowIdKey进行去重复
          // 注意，瀑布流模式下，若出现重复数据，说明后端数据已经存在变更，但客户端无法检测到前页的新增和删除情况
          // 此时只保证数据不重复，会存在分页无法实时更新问题，需要手动刷新
          if(useConcat.value){
            const newList = l.filter((item: any) => {
              const id = item[rowIdKey.value];
              return !state.list.some((item2: any) => item2[rowIdKey.value] === id);
            })
            if(options?.resetConcat){
              state.list = l as any
            }else{
              state.list = state.list.concat(newList as any[]);
            }
          }else{
            state.list = l as any;
          }
          checkPageFallback();
        }
        state.loading = false;
      }
    }
  }
  
  // 检测一次loadData的结果拿到后，是否存在本页已经被完全删除，需要退回上一页情况
  function checkPageFallback(){
    // 如果当前是第一页，那么忽略
    if(pagination.current === 1){
      return;
    }
    // 如果当前页已经超过maxPage，那么退回上一页
    if(pagination.current > maxPage.value){
      pagination.current = maxPage.value;
      if(!useConcat.value){
        // 单页模式下自动刷新上一页数据
        loadData();
      }
    }
  }

  function loadNextPage(){
    if(hasNextPage.value){
      pagination.current++;
      loadData();
    }
  }


  /**
   * 重置分页，这个函数不对外开放
   */
  function resetPagination() {
    pagination.current = 1;
    pagination.total = 0;
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
          await loadData({resetConcat: true});
        },
        debounceTime)
      await debounceFn();
      return;
    }
    resetPagination();
    await loadData({resetConcat: true});
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
    await loadData({resetConcat: true});
  }

  // 重置分页并加载
  async function resetPaginationAndLoad() {
    resetPagination();
    await loadData({resetConcat: true});
  }

  // 更新当前数据行
  function setRowNow(row: any) {
    state.rowNow = row;
  }


  return {
    state,
    pagination,
    hasNextPage,
    loadData,
    loadNextPage,
    changeQuery,
    resetQuery,
    resetPage,
    resetPaginationAndLoad,
    setRowNow,
    updateDefaultQuery
  }
}





