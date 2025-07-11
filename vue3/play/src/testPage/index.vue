<template>
  <div class="p-[20px] page-main overflow-auto">
    <h3>iconify图标测试</h3>
    <div>
      <i class="iconify-[carbon--view-off] ml-[5px] text-[#000]" />
      <i class="iconify-[carbon--view] ml-[5px] text-[#000]" />
      <CarbonView class="h-[16px] w-[16px] ml-[5px]" />
      <span class="iconify-[svg-spinners--bars-scale] ml-[5px]" />
      <h4>iconify和element的button</h4>
      <div class="flex">
        <div class="w-[100px]">预设字符串：</div>
        <el-button icon="Search"> 查看 </el-button>
      </div>
      <div class="flex mt-[5px]">
        <div class="w-[100px]">svg组件：</div>
        <el-button :icon="CarbonView"> 查看 </el-button>
      </div>
      <div class="flex mt-[5px]">
        <div class="w-[100px]">icon slot：</div>
        <el-button>
          <template #icon>
            <i class="iconify-[carbon--view] text-[green]" />
          </template>
          查看
        </el-button>
      </div>
    </div>
    <h3>组件引入测试</h3>
    <h3>commonToggle测试</h3>
    <el-button @click="toggle()">
      {{ visible ? "隐藏" : "显示" }}
    </el-button>
    <div />
    <h3>loadingConfirm测试</h3>
    <el-button @click="doLoadingConfirm"> loadingConfirm </el-button>
    <h3>commonList和BaseTable测试</h3>
    <div class="query-container">
      <div class="query-item">
        <div class="query-item-label">姓名：</div>
        <div class="query-item-value">
          <el-input v-model="query.name" />
        </div>
      </div>
      <div class="query-item">
        <div class="query-item-label">性别：</div>
        <div class="query-item-value" style="width: 300px">
          <dict-input v-model="query.gender" dict-key="gender_local" />
        </div>
      </div>
      <div class="query-item">
        <search-and-reload-btn @reset="resetPage" @search="loadData" />
      </div>
    </div>
    <BaseTable
      class="flex-1 w-full min-h-[300px]"
      :data="userListState.list"
      :loading="userListState.loading"
      :pagination="pagination"
      :columns="columns"
      use-table-tool
      use-pagination
      @size-change="resetPaginationAndLoad"
      @current-change="loadData()"
      @refresh="resetPage"
    >
      <template #item.age="{ row }">
        <el-tag>{{ row.age }}岁</el-tag>
      </template>
      <template #item.operations="{ row }">
        <el-button size="small" type="danger" @click="deleteRow(row)">
          删除
        </el-button>
      </template>
    </BaseTable>
    <h3>commonList-concat模式测试</h3>
    <concat-list />
    <h3>dictInput字典测试</h3>
    <dict-input-test />
    <h3>uploadAny组件测试</h3>
    <upload-any-test></upload-any-test>
    <h3>resettable测试</h3>
    <div>
      <h4>对象：</h4>
      <el-button @click="resetState"> 重置 </el-button>
      <div class="flex gap-[20px]">
        <el-input type="text" v-model="state.id" />
        <el-input type="text" v-model="state.name" />
      </div>
      <h4>原始类型</h4>
      <el-button @click="resetRefState"> 重置 </el-button>  
      <el-input type="number" v-model="refState" />
    </div>
    <h3>objectResolver测试</h3>
    <el-button @click="testResolver"> 测试 </el-button>
    <el-button @click="testResolverDebounce"> 测试快速解析去抖 </el-button>
  </div>
</template>

<script setup lang="ts">
import CarbonView from "~icons/carbon/view";
import {
  loadingConfirm,
  BaseTable,
  useList,
  DictInput,
  BaseTableColumn,
} from "@hykj-js/vue3-element-plus";
import {
  ensureDictData,
  FetchFuncParams,
  getDictData,
  useCommonToggle,
  useResettableRef,
  useResettableState,
} from "@hykj-js/vue3-hooks";
import { delay } from "@hykj-js/shared";
import { query, 人, 假数据库 } from "@/utils/mockData";
import { useUserResolver } from "./resolver-test";

// 测试commonToggle
const { value: visible, toggle } = useCommonToggle();
// 测试commonList
const columns: BaseTableColumn<人>[] = [
  {
    label: "姓名",
    prop: "name",
    align: "center",
  },
  {
    label: "年龄",
    prop: "age",
  },
  {
    label: "自定义字典性别",
    prop: "gender",
    dictKey: "gender_local",
  },
  {
    label: "测试普通远程字典",
    prop: "gender",
    dictKey: "test_remote_dict_key",
  },
  {
    label: "操作",
    prop: "operations",
    fixed: "right",
    width: "200px",
  },
];

const {
  state: userListState,
  loadData,
  resetPage,
  pagination,
  resetPaginationAndLoad,
  deleteRow,
} = useList<人>({
  query,
  fetchFunc: async (params: FetchFuncParams) => {
    logger.log("fetchFunc运行:", params, query, pagination);
    console.log("params.pagination.current:", params.pagination.current);
    console.log("pagination.current:", pagination.current);
    await delay(200);
    const result = await 假数据库.search(query, pagination);
    return {
      list: result.list,
      total: result.total,
      err: null,
    };
  },
  pagination: {
    size: 10,
    sizes: [2, 5, 10, 20],
  },
  deleteFunc: async (row: any) => {
    // 模拟删除一行数据
    await 假数据库.delete(row);
  },
});
onMounted(async () => {
  // await ensureDictData(['sys_user_sex'])
  await loadData();
  // 测试loadData的默认截流功能
  const testLoadDataOptionsList = Array.from({ length: 20 }).map(
    (_, index) => ({
      name: `test${index}`,
    })
  ) as any[];
  for (const item of testLoadDataOptionsList) {
    console.debug("loadData截流测试：", item);
    if (item.name === "test2") {
      loadData({ ...item, ignoreThrottle: true }); // 强制忽略截流
    } else if (item.name === "test10") {
      await delay(200); // 等待超过截流时间后调用
      loadData(item);
    } else {
      loadData(item); // 普通调用被截流
    }
  }
  await testFetchData();
  // 上面的baseTable中已经触发了远程字典的updateDictData
  // 测试同时在此请求test_remote_dict_key字典,202409添加并行等待
  await ensureDictData(["test_remote_dict_key"]);
  // 如果能正常打印出结果，表示并行updateDictData成功
  console.log("并行updateDictData测试：", getDictData("test_remote_dict_key"));
});

async function doLoadingConfirm() {
  const result = await loadingConfirm(
    {
      title: "测试",
    },
    async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });
    }
  ).catch(() => {});
  logger.log("loadingConfirm结果：", result);
}
// fetchData测试
async function testFetchData() {}

// 测试useResettable
const [state, resetState] = useResettableState({
  id: "111",
  name: "张三",
});
console.log('state', state)
const [refState , resetRefState] = useResettableRef('1');
console.log('refState', refState)


// 测试objectResolver
const [userResolver] = useUserResolver();
async function testResolver(){
  const result = await userResolver.resolveObjects(['1','2','3']);
  // @ts-ignore
  await userResolver.resolveObjects([null,null]);
  await userResolver.resolveObjects(['','','']);
  console.log('userResolver result', result)
}
async function testResolverDebounce() {
  const list = ['5','6','7', '7', '7', '7'];
  const result = await Promise.all(
    list.map((item) => {
      return userResolver.resolveObjects([item]);
    })
  );
  // @ts-ignore
  console.log('userResolver debounce result', result)
}
</script>

<style scoped></style>
