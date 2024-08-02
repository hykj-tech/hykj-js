import type { DictObj } from './index';
import {reactive} from 'vue-demi';
import {globalDictDataStore} from "./index";
export const localDictData = reactive<Record<string, DictObj[]>>({
  // 是否启用
  // enable: [
  //   {text: '启用', value: 1, style: {color: '#67C23A'}},
  //   {text: '禁用', value: 0, style: {color: '#F56C6C'}},
  // ],
  // 简单是否
  simpleYesNo: [
    {text: '是', value: 1},
    {text: '否', value: 0},
  ],
});

// 本地字典扩展，根据字典的value定位对对应的字典项进行数据扩展（覆盖）
export const dictDataExtend = reactive<Record<string, Omit<DictObj, 'text'>[]>>({
});

// 外部注册本地字典数据
export function registerLocalDictData(dictKey: string, dictData: DictObj[]) {
  localDictData[dictKey] = dictData;
  globalDictDataStore.globalDictData[dictKey] = dictData;
  stringify()
}

// 外部注册本地字典扩展
export function registerLocalDictDataExtend(dictKey: string, dictData: Omit<DictObj, 'text'>[]) {
  dictDataExtend[dictKey] = dictData;
}


function stringify(dictKey?: string) {
  // 递归对本地扩展字典中的value进行toString()
  function stringifyDictData(dictData: DictObj[]) {
    dictData.forEach(dict => {
      dict.value = dict.value?.toString();
      if (dict.children) {
        stringifyDictData(dict.children);
      }
    });
  }
  if (dictKey) {
    stringifyDictData(localDictData[dictKey]);
  } else {
    Object.keys(localDictData).forEach(key => {
      stringifyDictData(localDictData[key]);
    });
  }
}
