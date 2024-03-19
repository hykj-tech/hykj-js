import dayJS from "dayjs";

declare global {
  interface window{
    dayjs: dayJS
  }
  const dayjs = dayJS
}
export {}