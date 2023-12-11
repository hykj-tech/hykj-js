export interface CommonJson {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | CommonJson
    | CommonJson[];
}

// 随机来一个测试方法
export function randomNum(min: number = 0, max: number = 100) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// 随机字符串
export function randomString(len: number = 32) {
  const $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz12345678';
  const maxPos = $chars.length;
  let pwd = '';
  for (let i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
}

import qs from 'qs'

export const queryStringBuilder = (params: any) => {
  return  '?' + qs.stringify(params);
}


/**
 * 在树形数据中进行搜索
 * @param treeList 需要搜索的树
 * @param fn 查询函数
 * @param options 选项
 */
export function findInTree<obj>(
  treeList: obj[],
  fn: (item: obj) => boolean,
  options?: {children: string}
): obj | null {
  for (let i = 0; i < treeList.length; i++) {
    const item = treeList[i] as obj & CommonJson;
    if (fn(item)) {
      return item;
    }
    const childKey = options?.children || 'childList';
    if (item[childKey]) {
      const result = findInTree(item[childKey] as obj[], fn, options);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

// setTimeoutPromise封装
export async function delay(ms = 1000) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

// 将任意的字符串或数字转换为最多保留N位小数点位置
export function anyToFlexFixedNumber(value: any, maxDecimal: number = 0) {
  // 校验value是不是数字
  const numberValue = Number(value);
  if (isNaN(numberValue)) {
    return 0;
  }
  const toFixedValue = numberValue.toFixed(maxDecimal);
  // 去掉小数点后多余的0
  return Number(toFixedValue);
}
// 给任意长度的字符串添加mask
export function maskString(str: string, options?: {len?: number, start?: number}) {
  const strLen = str.length;
  // mask长度默认为字符串的一半
  let maskLen = options?.len;
  if (typeof maskLen !== 'number') {
    maskLen = Math.floor(strLen / 2);
  }
  let startIndex = options?.start;
  if (typeof startIndex !== 'number') {
    const offset = (maskLen / 2)
    // 默认mask开始为字符串的中央
    startIndex = Math.floor(strLen / 2) - offset;
    // 如果maskLen为奇数，需要向后偏移一位
    if (maskLen % 2 === 1) {
      startIndex += 1;
    }
  }
  const maskStr = '*'.repeat(maskLen);
  let result = str.slice(0, startIndex) + maskStr + str.slice(startIndex + maskLen);
  // 最终长度不能超过strLen
  if (result.length > strLen) {
    result = result.slice(0, strLen);
  }
  return result;
}

import {cloneDeep} from 'lodash-es';
// structureClone的polyfill,如果globalThis不存在，使用lodash-es的cloneDeep
export const structuredClone = globalThis?.structuredClone || cloneDeep;
export const polyfillStructuredClone = () => {
  if (globalThis && !globalThis.structuredClone){
    globalThis.structuredClone = cloneDeep;
  }
}
