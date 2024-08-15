import {
  UnwrapNestedRefs,
  computed,
  isReactive,
  reactive,
  ref,
  toRaw,
} from "vue-demi";
import { structuredClone } from "@hykj-js/shared";

/**
 * 主API的主参数
 */
export type UseCommonListOptions<RowType = any> = {
  /**
   * 初始的查询参数对象，一般外部需要传输响应式数据，这里只做重置query的记录拦截，不属于API内部的状态
   */
  query?: CommonListQuery;
  /**
   * 更新列表的方法
   */
  fetchFunc?: FetchFunc<RowType>;
  /**
   * 初始的分页参数定义
   */
  pagination?: UseCommonListPaginationDefine;
  /**
   * 当前行数据Key,默认为id
   */
  rowIdKey?: string;
  /**
   * 使用concat模式，实现瀑布流加载，通常是结合返回的hasNextPage和loadNextPage在移动端用
   */
  useConcat?: boolean;
};

/**
 * 传入的搜索参数对象,用于resetQuery
 */
export type CommonListQuery =
  | Record<string, any>
  | UnwrapNestedRefs<Record<string, any>>;

/**
 * 列表函数
 */
export type FetchFunc<RowType = any> = (
  params: FetchFuncParams<RowType>
) => Promise<FetchFuncResult<RowType> | FetchFuncResultTuple<RowType>>;

/**
 * 列表函数返回对象模式
 */
export type FetchFuncResult<RowType = any> = {
  list: RowType[];
  total: number;
  // 显式返回的错误
  err?: any;
};

/**
 * 列表函数返回Tuple模式
 */
export type FetchFuncResultTuple<RowType = any> =
  | Readonly<[RowType[], number]>
  | Readonly<[RowType[], number, any]>;

/**
 * 列表方法会携带的参数，
 * 不推荐直接使用外部return的pagination，会影响类型系统的判断
 * 这里提供运行时的分页、当前列表、当前总数等参数用于其他扩展逻辑判断
 */
export type FetchFuncParams<RowType = any> = {
  /**
   * 将要fetch的分页参数
   */
  pagination: {
    size: number;
    current: number;
  };
  /**
   * fetch前的列表数据
   */
  list: RowType[];
  /**
   * fetch前的列表总数
   */
  total: number;
};

/**
 * 定义pagination初始值参数
 */
export type UseCommonListPaginationDefine = {
  size?: number;
  layout?: string;
  current?: number;
  sizes?: number[];
};

/**
 * 返回的pagination响应式对象
 */
export type ListPagination = {
  /**
   * 当前页大小
   */
  size: number;
  /**
   * 当前页数
   */
  current: number;
  /**
   * 列表总数（用于运行时计算分页）
   */
  total: number;
  /**
   * el-pagination预设支持
   */
  layout: string;
  sizes: number[];
};

/**
 * changeQuery方法的可选参数
 */
export type ChangeQueryOptions = {
  /**
   * 去抖
   */
  debounce?: number;
};

export type LoadDataOptions = {
  loading?: boolean;
  resetConcat?: boolean;
};

export const useCommonList = <RowType>(
  options: UseCommonListOptions<RowType>
) => {
  // 当前行数据Key
  const rowIdKey = ref(options.rowIdKey || "id");
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
  });
  // 分页数据储存
  const pagination = reactive<ListPagination>(
    Object.assign(
      {
        // 预设适配el-table的分页参数
        layout: "total, sizes, prev, pager, next, jumper",
        sizes: [10, 25, 50, 100],
        current: 1,
        size: 10,
        total: 0,
      },
      options.pagination
    )
  );
  const fetchFunc = options.fetchFunc;
  let loadDataLock: string | number = "";
  let defaultQuery: Record<any, any>;
  if (isReactive(options.query)) {
    defaultQuery = structuredClone(toRaw(options.query));
  } else {
    defaultQuery = structuredClone(options.query || {});
  }

  // 当前分页最大页数
  const maxPage = computed(() => Math.ceil(pagination.total / pagination.size));
  // 是否还有下一页
  const hasNextPage = computed(() => pagination.current < maxPage.value);

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
    const loadDataOptions = options || { loading: true };
    try {
      if (loadDataOptions.loading !== false) {
        state.loading = true;
      }
      // 使用固定的this.fetchList方法, 要求返回{list,total, err} 或者 [list,total, err]
      if (fetchFunc && fetchFunc instanceof Function) {
        const fetchFuncResult =
          (await fetchFunc({
            pagination: {
              size: pagination.size,
              current: pagination.current,
            },
            list: state.list as RowType[],
            total: pagination.total,
          })) || {};
        let s;
        let e;
        if (fetchFuncResult instanceof Array && fetchFuncResult.length >= 2) {
          const r = fetchFuncResult;
          s = [r[0], r[1], r[2]] as FetchFuncResultTuple<RowType>;
          l = s[0] || [];
          t = s[1] || 0;
          e = s[2] || null;
        } else {
          s = fetchFuncResult as FetchFuncResult<RowType>;
          l = s.list || [];
          t = s.total || 0;
          e = s.err || null;
        }
        if (e) hasErr = true;
      }
    } catch (e) {
      console.error(e);
      hasErr = true;
    } finally {
      if (lockNow === loadDataLock) {
        // 只有无错误时才进行状态更新
        if (!hasErr) {
          pagination.total = t;
          // 如果当前时瀑布流模式 使用concat, 并需要根据rowIdKey进行去重复
          // 注意，瀑布流模式下，若出现重复数据，说明后端数据已经存在变更，但客户端无法检测到前页的新增和删除情况
          // 此时只保证数据不重复，会存在分页无法实时更新问题，需要手动刷新
          if (useConcat.value) {
            const newList = l.filter((item: any) => {
              const id = item[rowIdKey.value];
              return !state.list.some(
                (item2: any) => item2[rowIdKey.value] === id
              );
            });
            if (options?.resetConcat) {
              state.list = l as any;
            } else {
              state.list = state.list.concat(newList as any[]);
            }
          } else {
            state.list = l as any;
          }
          checkPageFallback();
        }
        state.loading = false;
      }
    }
  }

  // 检测一次loadData的结果拿到后，是否存在本页已经被完全删除，需要退回上一页情况
  function checkPageFallback() {
    // 如果当前是第一页，那么忽略
    if (pagination.current === 1) {
      return;
    }
    // 如果当前页已经超过maxPage，那么退回上一页
    if (pagination.current > maxPage.value) {
      pagination.current = maxPage.value;
      if (!useConcat.value) {
        // 单页模式下自动刷新上一页数据
        loadData();
      }
    }
  }

  function loadNextPage() {
    if (hasNextPage.value) {
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
   * 重置搜索条件
   */
  function resetQuery() {
    if (options?.query) {
      // 针对defaultQuery逐个字段赋值更新
      Object.keys(defaultQuery).forEach((key) => {
        options.query[key] = defaultQuery[key];
      });
    }
  }

  /**
   * 开放一个方法，可以动态修改defaultQuery
   * @param query
   */
  function updateDefaultQuery(query: Record<string, any>) {
    Object.keys(query).forEach((key) => {
      defaultQuery[key] = query[key as keyof typeof query];
    });
  }

  /**
   * 重置页面（重置搜索条件并清空列表（可选）重新加载）
   */
  async function resetPage(options?: {
    /**
     * 是否清空列表后加载
     */
    clearList?: boolean;
  }) {
    if (options?.clearList) {
      state.list = [];
    }
    resetQuery();
    resetPagination();
    await loadData({ resetConcat: true });
  }

  /**
   * 重置分页并加载（通常用于分页sizes变化时）
   */
  async function resetPaginationAndLoad() {
    resetPagination();
    await loadData({ resetConcat: true });
  }

  /**
   * 更新当前数据行
   * @param row
   */
  function setRowNow(row: any) {
    state.rowNow = row;
  }

  return {
    /**
     * 列表的一些状态，包含loading,list,rowNow
     */
    state,
    /**
     * 返回的分页对象(响应式)，是为了方便el-pagination组件使用的预设功能
     */
    pagination,
    /**
     * 判断是否还有下一页，是一个计算属性，通常用于concat模式
     */
    hasNextPage,
    /**
     * 使用当前状态加载数据，将会调用fetchFunc
     */
    loadData,
    /**
     * 根据hasNextPage自动对分页+1并loadData,通常用于concat模式下onReachBottom事件
     */
    loadNextPage,
    /**
     * 重置搜索条件，建议在“重置”按钮使用，并全局监听query变化使用去斗的resetPaginationAndLoad
     */
    resetQuery,
    /**
     * 包含清空列表（可选），重置query，重置分页，加载页面
     */
    resetPage,
    /**
     * 重置分页并加载（通常用于分页sizes变化时）
     */
    resetPaginationAndLoad,
    /**
     * 更新当前数据行
     * @param row
     */
    setRowNow,
    updateDefaultQuery,
  };
};
