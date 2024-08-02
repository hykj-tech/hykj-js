<template>
  <div class="cp-dict-input" style="width: 100%">
    <!--    常用选择-->
    <template v-if="inputTypeToUse === 'select'">
      <el-select
          :teleported="useTeleported"
          style="width: 100%"
          v-model="_value"
          @change="change"
          v-loading="loading && !disableLoading"
          v-bind="elementOptions"
          :filterable="filterable"
          :no-data-text="noDataText"
      >
        <el-option
            v-for="item in elSelectDictData"
            :style="styleDisplay ? getStyle(item.style) : ''"
            :key="item.value"
            :label="item[labelKey]"
            :value="item[valueKey]"
        />
      </el-select>
    </template>
    <!--    简单单选框-->
    <template v-if="inputTypeToUse === 'radio'">
      <el-radio
          style="width: 100%"
          :disabled="elementOptions.disabled"
          :key="item.value"
          v-for="item in dictData"
          v-model="_value as string"
          :label="item.value"
      >{{ item.text }}
      </el-radio
      >
    </template>
    <!--    树形字典选择-->
    <template v-if="inputTypeToUse === 'tree'">
      <el-tree-select
          :teleported="useTeleported"
          :check-strictly="treeOptionsToUse.checkStrictly"
          :collapse-tags='treeOptionsToUse.collapseTags'
          :placeholder="treeOptionsToUse.placeholder"
          :default-expand-all="treeOptionsToUse.defaultExpandAll"
          style="width: 100%"
          v-model="_value"
          :data="dictData"
          :props="{
          value: valueKey,
          label: labelKey,
          disabled: treeOptionsToUse.treeNodeDisabled,
          }"
          :size="treeOptionsToUse.size"
          :loading="loading && !disableLoading"
          :clearable="treeOptionsToUse.clearable"
          filterable
          :cache-data="cacheData"
          :disabled="treeOptionsToUse.disabled"
          :multiple="treeOptionsToUse.multiple"
          @change="change"
          :show-checkbox="treeOptionsToUse.showCheckbox"
      >
      </el-tree-select>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, reactive, watch} from "vue";
import {DictObj, getDictData} from "@hykj-js/vue3-hooks";
import {safeJSONParse} from "@hykj-js/shared";
import {ElSelect, ElOption, ElRadio, ElTreeSelect, vLoading} from "element-plus";

type Props = {
  teleported?: boolean,
  customDictData?: DictObj[],
  dictKey: string,
  inputType?: string,
  modelValue?: string | number | string[] | number[],
  disabled?: boolean,
  multiple?: boolean,
  clearable?: boolean,
  placeholder?: string,
  size?: "" | "small" | "default" | "large",
  styleDisplay?: boolean,
  // element组件的其他属性
  options?: Record<string, any>,
  // groupKey自定义分组，用于级联数据, 格式 dictData => Boolean, 其中dictData为遍历的字典数据项
  groupKeyFilter?: (dictData: DictObj) => boolean,
  // 树形选择配置
  treeOptions?: Record<string, any>,
  // 是否可搜索，只针对select
  filterable?: boolean,
  // 禁用loading
  disableLoading?: boolean,
  // 用于tree-select
  cacheData?: DictObj[]
}
// 固定的labelKey和valueKey
const labelKey = 'text'
const valueKey = 'value'

const defaultElementOptions = {
  placeholder: '请选择',
  clearable: true,
  // size: 'medium'
};

// 获取props，并赋予一些初始值
const props = withDefaults(defineProps<Props>(), {
  inputType: 'select',
  disabled: false,
  multiple: false,
  clearable: true,
  placeholder: '请选择',
  size: '',
  styleDisplay: false,
  options: {} as any,
  treeOptions: {} as any,
  filterable: false,
  disableLoading: false,
  cacheData: [] as any,
  teleported: false,
})

// 是否使用el-select的teleported

const useTeleported = computed(() => {
  return props.teleported
})

const internalState = reactive({
  value: props.modelValue,
  loadingTimeout: false
})
// element组件属性
const elementOptions = computed(() => {
  return Object.assign(
      {},
      defaultElementOptions,
      {
        size: props.size,
        disabled: props.disabled,
        clearable: props.clearable,
        multiple: props.multiple,
        placeholder: props.placeholder,
      },
      props.options
  ) 
})

// tree组件属性
const treeOptionsToUse = computed(() => {
  const eov = elementOptions.value
  const defaultOptions = {
    // 是否随意选择父子节点，否则只选择子节点
    checkStrictly: false,
    // 是否自动省略多选标签回显
    collapseTags: true,
    // 多选是否显示勾选框
    showCheckbox: false,
    clearable: eov.clearable,
    placeholder: eov.placeholder,
    disabled: eov.disabled,
    multiple: eov.multiple,
    size: props.size || eov.size,
  }
  return Object.assign(defaultOptions, props.treeOptions)
})

// 无数据时的文本
const noDataText = computed(() => {
  return props.options?.noDataText || '暂无数据'
})

// 最终使用的字典列表
const dictData = computed(() => {
  const data = props.customDictData ? props.customDictData : getDictData(props.dictKey);
  // groupKeyFilter 过滤
  if (props.groupKeyFilter && props.groupKeyFilter instanceof Function) {
    return data.filter(props.groupKeyFilter);
  }
  return data
})

// 给el-select使用的dictData，针对数据缓存，如果字典数据没有对应value的dictObj，那么这时候
// 如果存在cacheData,那么把cacheData加入到dictData中，cacheData要放在前面
const elSelectDictData = computed(() => {
  // 判断当前value存在于dictData中
  const value = internalState.value
  const dictDataToUse = dictData.value
  if (value && dictDataToUse) {
    const dictObj = dictDataToUse.find(i => i[valueKey]?.toString() === value?.toString())
    if (!dictObj) {
      return [...props.cacheData, ...dictDataToUse]
    }
  }
  return dictDataToUse
})

// 是否loading
const loading = computed(() => {
  if (internalState.loadingTimeout) {
    return false
  }
  if (props.groupKeyFilter instanceof Function) {
    return !dictData.value
  }
  return !dictData.value || dictData.value.length === 0
})

// inputType
const inputTypeToUse = computed(() => {
  const typeList = ['select', 'radio', 'tree']
  if (typeList.includes(props.inputType)) {
    return props.inputType
  } else {
    return typeList[0]
  }
})

// 定义emit
const emit = defineEmits(['update:modelValue', 'change'])

// 组件使用的v-model
const _value = computed({
  get() {
    if (props.multiple) {
      return (internalState.value as string[]).map(i => i?.toString())
    }
    return internalState.value?.toString() || ''
  },
  set(v) {
    let value: string | string[] = v?.toString()
    if(props.multiple){
      value = (v as string[]).map(i => i?.toString())
    }
    internalState.value = value as any
    emit('update:modelValue', value)
    if (inputTypeToUse.value === 'radio') {
      emit('change', value);
    }
  }
})

// change事件穿透
function change(value: string | number | string[] | number[]) {
  emit('change', value)
}

function getStyle(v) {
  return v ? safeJSONParse(v) : ''
}

let timeout;
onMounted(() => {
  timeout = setTimeout(() => {
    internalState.loadingTimeout = true
  }, 1000 * 10)
})

onBeforeUnmount(() => {
  clearTimeout(timeout)
})

watch(() => props.modelValue, (v) => {
  internalState.value = v
})

</script>

<style scoped>

</style>
