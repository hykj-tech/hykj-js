import { delay } from '@hykj-js/shared'
import {
  registerLocalDictData,
  registerTranslateDefine,
  registerLocalDictDataExtend,
} from '@hykj-js/vue3-hooks'

export function 初始化本地字典() {
  registerLocalDictData('gender_local', [
    { text: '男', value: 0 },
    { text: '女', value: 1 },
    { text: '未知', value: 2 },
  ])
  registerLocalDictData('yesOrNo', [
    { text: '是', value: 1 },
    { text: '否', value: 0 },
  ])
  // 测试树形字典
  registerLocalDictData('tree_test_local', [
    {
      text: '广西',
      value: 1,
      children: [
        { text: '南宁', value: 11 },
        { text: '玉林', value: 12 },
        { text: '柳州', value: 13 },
        // {text: '百色', value: 14,
      ],
    },
    {
      text: '四川',
      value: 2,
      children: [
        { text: '成都', value: 21 },
        { text: '重庆', value: 22 },
      ],
    },
    {
      text: '贵州',
      value: 3,
      children: [
        {
          text: '贵阳',
          value: 31,
          children: [
            { text: '南明区', value: 311 },
            { text: '云岩区', value: 312 },
          ],
        },
      ],
    },
  ])
  // 测试扩展字典定义（用test_remote_dict_key）
  registerLocalDictDataExtend('test_remote_dict_key', [
    { value: '0', style: {color: 'red'} },
    { value: '1' , style: {color: 'green'} },
    { text: '测试远程字典3(local_extend)', value: '2', style: {color: 'blue'} },
  ])
}

export function 定义翻译数据() {
  // 定义默认的字典获取
  registerTranslateDefine({
    match: dictKey => dictKey === 'test_remote_dict_key' ,
    getData: async _dictKey => {
      console.time('模拟远程字典请求')
      await delay(1000)
      console.timeEnd('模拟远程字典请求')
      return [
        { dictLabel: '测试远程字典1', dictValue: '0' },
        { dictLabel: '测试远程字典2', dictValue: '1' },
        { dictLabel: '测试远程字典3', dictValue: '2' },
      ]
    },
    // formatKeyMap: {
    //   text: 'dictLabel',
    //   value: 'dictValue',
    //   sort: 'dictSort',
    // },
    // 测试使用formatter
    formatter: (data) => {
        return {
          text: data.dictLabel,
          value: data.dictValue,
          sort: data.dictSort,
        }
    },
  })
}
