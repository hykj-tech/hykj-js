import { 人, 假数据库 } from "@/utils/mockData";
import { ObjectResolver } from "@hykj-js/shared";
const map = reactive<Record<string, 人>>({})

const resolver = new ObjectResolver<人>(async (ids: string[]) => {
  console.log('use resolve start', ids)
  const objects = 假数据库.data.filter(object => ids.includes(object.id?.toString()))
  objects.forEach(object => {
    map[object.id?.toString()] = object
  })
  return objects.map(object => ({ ...object }))
})

export const useUserResolver = () => {
  return [resolver, map] as const
}
