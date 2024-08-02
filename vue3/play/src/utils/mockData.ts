import { delay, randomNum, randomString } from '@hykj-js/shared'

export type 人 = {
  id: number
  name: string
  age: number
  gender: number
}

export type QueryType = {
  name: string | undefined
  gender: string | number | undefined
}
export const query = reactive<QueryType>({
  name: '小明',
  gender: undefined,
})

export class FakeDatabase {
  data = [] as 人[]

  constructor() {
    // 生生储存1000个假数据
    for (let i = 0; i < 25; i++) {
      this.data.push({
        id: i,
        name: '小明' + randomString(4) + `_${i + 1}`,
        age: randomNum(10, 20),
        gender: randomNum(0, 2),
      })
    }
  }

  async search(
    query: { name?: string; gender?: string | number },
    pagination: { current: number; size: number }
  ) {
    await delay(300)
    let list = [] as 人[]
    // 对query.name进行过滤
    if (query.name) {
      list = this.data.filter(item => item.name.includes(query.name!))
    }
    // 对query.gender进行过滤
    if (query.gender?.toString()) {
      list = list.filter(
        item => item.gender?.toString() === query.gender?.toString()
      )
    }
    // 对pagination进行截断
    const page = list.slice(
      (pagination.current - 1) * pagination.size,
      pagination.current * pagination.size
    )
    return {
      list: page,
      total: list.length,
    }
  }

  async delete(row: any) {
    await delay(300)
    const index = this.data.findIndex(item => item.id === row.id)
    if (index === -1) return
    this.data.splice(index, 1)
  }
}

export const 假数据库 = new FakeDatabase()
