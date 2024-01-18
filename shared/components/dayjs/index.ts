// dayjs
import dayjs from 'dayjs'
import zh from 'dayjs/locale/zh-cn'

/**
 * 初始化dayjs，将挂载全局dayjs对象
 */
export const initDayjs = () => {
  dayjs.locale(zh)
  // 扩展dayjs默认format功能
  const defaultFormat = 'YYYY-MM-DD HH:mm:ss'
  dayjs.extend((option, dayjsClass, dayjsFactory) => {
    const oldFormat = dayjsClass.prototype.format

    dayjsClass.prototype.format = function (formatString) {
      return oldFormat.bind(this)(formatString ?? defaultFormat)
    }
  });
  (globalThis as any).dayjs = dayjs
  return dayjs;
}
