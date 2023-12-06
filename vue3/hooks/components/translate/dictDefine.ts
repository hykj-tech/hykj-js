import type {FormatKeyMap, UpdateDictDataOptions} from './index';
// 这个模块用于存储字典数据获取的定义
export type TranslateDefine = {
  formatKeyMap: FormatKeyMap;
  match: (dictKey?: string) => boolean;
  getData: (
    dictKey: string,
    options?: UpdateDictDataOptions
  ) => Promise<any>;
};

export const translateDefineList: TranslateDefine[] = [
];

// 供外部使用的注册字典定义的方法
export const registerTranslateDefine = (translateDefine: TranslateDefine) => {
  translateDefineList.unshift(translateDefine);
}
