import {translateDefineList, registerTranslateDefine as rtd} from './dictDefine';
import {findInTree} from '@hykj-js/shared';
import {localDictData, dictDataExtend, registerLocalDictData as rldd, registerLocalDictDataExtend as rldde} from './localDictData'
import {computed, reactive,} from 'vue-demi';

// 供外部使用调用的定义翻译数据的方法
// 定义动态翻译数据更新行为
export const registerTranslateDefine = rtd;
// 定义前端本地字典数据
export const registerLocalDictData = rldd;
// 定义前端本地字典数据扩展
export const registerLocalDictDataExtend = rldde;

/**
 * 字典数据对象
 */
export type DictObj = {
  // 字典类型
  dictKey?: string;
  value: string | number;
  text: string;
  sort?: string | number;
  children?: DictObj[];
  hasChildren?: boolean;
  remark?: string;
  style?: string | Record<string, string>;
  path?: string[];
  textPath?: string[];
};

/**
 * 更新字典的选项
 */
export type UpdateDictDataOptions = {
  forceUpdate?: false;
};

// 字典格式化map
export type FormatKeyMap = {
  value: string;
  text: string;
  style?: string;
  remark?: string;
  sort?: string;
  children?: string;
  otherProps?: string[];
};

// 字典格式化自定义方法
export type Formatter = (data: any) => Partial<DictObj>;

const loadingStatusMap: Record<string, boolean | string> = {};

/**
 * 多次updateDictData的排队
 */
const waitingPromiseCtxMap: Record<string, ((value: any)=> void)[]> = {};

/**
 * 全局响应式数据储存
 */
export const globalDictDataStore = reactive({
  // 字典数据
  globalDictData: Object.assign({}, localDictData),
});


// 更新字典数据方法
export async function updateDictData(
  dictKey: string,
  options?: UpdateDictDataOptions
) {
  if (!dictKey) {
    return;
  }
  try {
    const dataNow = globalDictDataStore.globalDictData;
    const dictNow = dataNow[dictKey];
    // 除非指定强制更新，否则不更新已经存在的字典
    let needFetch = !!options?.forceUpdate;
    if (needFetch || !dictNow) {
      if (loadingStatusMap[dictKey] === true) {
        // 如果已经在加载中，等待加载完成
        return new Promise((resolve) => {
          if(!waitingPromiseCtxMap[dictKey]){
            waitingPromiseCtxMap[dictKey] = [];
          }
          waitingPromiseCtxMap[dictKey].push(resolve);
        });
      }
      loadingStatusMap[dictKey] = true;
      // 获取字典数据
      const translateDefine = translateDefineList.find(i => i.match(dictKey));
      if (!translateDefine) {
        throw new Error(`字典数据获取出错:未找到字典数据定义`);
      }
      const rawDictData = await translateDefine.getData(dictKey, options);
      if (!rawDictData || !rawDictData?.length) {
        throw new Error('字典数据获取出错:字典数据为空');
      }
      const formatData = formatDictData(
        rawDictData,
        translateDefine.formatKeyMap,
        translateDefine.formatter
      );
      // 确保被访问过的dictKey不为空,
      // 这里这样处理是因为想实现统一调用字典数据相关方法后可以自动更新字典
      // 使用空数组防止循环调用
      // 所以字典数据库更新后，想要拿到新数据，需要刷新页面，或显式调用fetchGlobalDictData
      dataNow[dictKey] = (formatData || localDictData[dictKey] || [])
        // value默认排序
        .sort((a, b) => a.value - b.value)
        // sort指定排序
        .sort((a, b) => a.sort - b.sort)
        .map(item => {
          item.value = item.value?.toString();
          item.dictKey = dictKey;
          if (dictDataExtend[item.dictKey]) {
            const extendItem = dictDataExtend[item.dictKey].find(
              i => i.value?.toString() === item.value?.toString()
            );
            if (extendItem) {
              Object.keys(item).forEach(key => {
                const k = key as keyof DictObj;
                if (key === 'value') return;
                if (extendItem[k] !== undefined) {
                  item[key] = extendItem[k];
                }
              });
            }
          }
          return item;
        });
    }
    // 标记该字典本次加载已经完成，整个生命周期中不再重新更新
    loadingStatusMap[dictKey] = 'loaded';
    resolveWaitingPromise(dictKey);
  } catch (err) {
    // 一旦失败，允许下次字典更新的时候重新请求
    // 注意这里很容易会出现循环调用溢出，出错若不为请求问题，需要排查try内的代码是否正常
    loadingStatusMap[dictKey] = false;
    console.log(`updateDictData失败(dictKey:${dictKey})：`, err);
    resolveWaitingPromise(dictKey);
  }
}

// 完成等待中的promise
function resolveWaitingPromise(dictKey: string){
  if(waitingPromiseCtxMap[dictKey]){
    waitingPromiseCtxMap[dictKey].forEach(resolve => resolve(true));
    waitingPromiseCtxMap[dictKey] = [];
  }
}

// 批量更新字典数据方法
export async function ensureDictData(dictKeyList: string[]) {
  await Promise.allSettled(dictKeyList.map(dictKey => updateDictData(dictKey)));
}


// 在字典数据中查找字典对象
function translateToObject(dictKey: string, value: string | number) {
  const dictData = globalDictDataStore.globalDictData;
  const dict = dictData[dictKey];
  // 后端value字段可能是-1，代表后端无法找到关系的属性，是一个错误的数值，统一处理
  const valueToUse = value === -1 ? '' : value;
  const defaultTarget = {value, text: ''};
  if (!dictKey) {
    return defaultTarget;
  }
  if (!dict) {
    // console.info(`[dictTranslate] 字典类型${dictKey}不存在，将尝试自动更新字典`);
    // 自动尝试获取字典
    if (!loadingStatusMap[dictKey]) {
      updateDictData(dictKey).then();
    }
    return defaultTarget;
  }
  const searchValue = valueToUse?.toString();
  const target = findInTree(
    dict,
    item => {
      return item.value?.toString() === searchValue;
    },
    {children: 'children'}
  );
  if (target) {
    return target;
  } else {
    return defaultTarget;
  }
}

/**
 * 获取字典项中的样式对象，一般的,style使用JSON格式储存
 */
function getDictStyle(dictObj: DictObj): Record<string, string> {
  const styleJsonString = dictObj.style;
  if (typeof styleJsonString === 'object') {
    return dictObj.style as Record<string, string>;
  }
  if (!styleJsonString) {
    return {};
  } else {
    try {
      return JSON.parse(styleJsonString);
    } catch {
      return {};
    }
  }
}

export function dictTranslate(dictKey: string, value: string | number) {
  const dictObj = translateToObject(dictKey, value);
  return {
    detail: dictObj as DictObj & Record<string, any>,
    text: dictObj.text,
    style: getDictStyle(dictObj),
  };
}

// 获取字典数据方法，这个方法是异步的，需要靠响应式数据来更新
export function getDictData(dictKey: string, options?: UpdateDictDataOptions) {
  if (!dictKey) {
    return [];
  }
  const dictData = globalDictDataStore.globalDictData;
  const target = dictData[dictKey];
  if (!target) {
    // 尝试自动获取字典
    if (!loadingStatusMap[dictKey]) {
      // console.log(`[getDictData] 字典类型${dictKey}不存在，将尝试自动更新字典`);
      updateDictData(dictKey, options);
    }
  }
  return target || [];
}

// vue3用的computed
export function useDictData(dictKey: string, options?: UpdateDictDataOptions) {
  return computed(() => {
    return getDictData(dictKey, options);
  })
}

// 转换字典数据
function formatDictData(data: any[], formatKeyMap: FormatKeyMap, formatter: Formatter) {
  const keyMap = formatKeyMap || {} as any;
  if (!keyMap.sort?.toString()) keyMap.sort = keyMap.value;
  if (!keyMap.style) keyMap.style = 'style';
  if (!keyMap.remark) keyMap.remark = 'remark';
  const sortKey = keyMap.sort || 'sort';
  const styleKey = keyMap.style || 'style';
  const remarkKey = keyMap.remark || 'remark';
  const childrenKey = keyMap.children || 'children';
  const formatterByDefault = (item: any)=> {
    const remark = item[remarkKey] || item.remark || '';
    const style = item[styleKey] || item.style || remark || '';
    return {
      value: item[keyMap.value],
      text: item[keyMap.text],
      sort: item[sortKey],
      remark,
      style,
    } as DictObj;
  }
  const result = data.map(item => {
    const formatObjByDefault = formatterByDefault(item);
    const formatObj: DictObj = formatter ? {...formatObjByDefault, ...formatter(item)} : formatObjByDefault ;
    if (item[childrenKey]?.length) {
      formatObj.children = formatDictData(item[childrenKey], keyMap, formatter);
      formatObj.hasChildren = true;
    }
    if (keyMap.otherProps && keyMap.otherProps.length) {
      const otherProps = keyMap.otherProps;
      otherProps.forEach(prop => {
        if (item[prop]) {
          (formatObj as any)[prop] = item[prop];
        }
      });
      return formatObj;
    }
    return {
      ...item,
      ...formatObj,
    };
  });
  // 字典统一添加树形路径记录
  const preProcess = (
    data: DictObj[],
    path: string[] = [],
    textPath: string[] = []
  ) => {
    data.forEach(item => {
      item.path = [...path, item.value?.toString()];
      item.textPath = [...textPath, item.text];
      if (item.children?.length) {
        preProcess(item.children, item.path, item.textPath);
      }
    });
  };
  preProcess(result);
  return result;
}
