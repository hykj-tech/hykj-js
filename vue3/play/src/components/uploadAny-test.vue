<template>
  <div>
    <button @click="toggleUseDrag">
      {{ useDrag ? '已开启拖拽上传' : '未开启拖拽上传' }}
    </button>
    <upload-any
    :fileList="fileList"
    :beforeNormalUpload="beforeNormalUpload"
    :accept="accept"
    @done="onDone"
    @changed="onChanged"
    @remove="onRemove"
    :useDrag="useDrag"
    :limit="2"
    >
    </upload-any>
  </div>
</template>

<script setup lang="ts">
import { BeforeNormalUploadPayload, UploadAny } from '@hykj-js/vue3-element-plus';
import { UploadAnyFile } from '@hykj-js/vue3-element-plus/components';

const fileList = ref([] as UploadAnyFile[])

// accept文件限制测试
const accept = '.jpg,.png,jpeg'
// const accept = ['.jpg','.png','jpeg']

const beforeNormalUpload = async (payload: BeforeNormalUploadPayload) =>{
  console.log('beforeNormalUpload', payload)
} 

const onDone = (fileList: UploadAnyFile[]) => {
  console.log('onDone', fileList)
}
const onChanged = (fileList: UploadAnyFile[]) => {
  console.log('onChanged', fileList)
}
const onRemove = (file: UploadAnyFile) => {
  console.log('onRemove', file)
}

const useDrag = ref(true);

const toggleUseDrag = () => {
  useDrag.value = !useDrag.value;
};
</script>

<style scoped>

</style>