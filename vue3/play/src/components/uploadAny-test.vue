<template>
  <div>
    <upload-any
    :fileList="fileList"
    :beforeNormalUpload="beforeNormalUpload"
    :accept="accept"
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
  console.log(payload)
} 
</script>

<style scoped>

</style>