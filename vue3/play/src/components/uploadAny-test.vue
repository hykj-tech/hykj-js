<template>
  <div>
    <upload-any
    :fileList="fileList"
    :beforeNormalUpload="beforeNormalUpload"
    :accept="accept"
    @done="onDone"
    @changed="onChanged"
    @remove="onRemove"
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
</script>

<style scoped>

</style>