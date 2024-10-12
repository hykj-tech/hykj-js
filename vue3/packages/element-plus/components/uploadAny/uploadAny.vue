<template>
  <div class="upload-any" :data-standalone="props.standalone">
    <div class="file-list" v-if="!props.standalone">
      <div class="file-item" v-for="(fileItem, index) in state.fileList" :key="getFileUrl(fileItem) + index"
        :data-has-file-item-slot="hasFileItemSlot">
        <div class="delete-btn" @click="deleteFile(index)" v-if="!props.disabled">
          <!-- <i class="icon el-icon-circle-close"></i> -->
          <el-icon class="icon">
            <CircleCloseFilled></CircleCloseFilled>
          </el-icon>
        </div>
        <!-- 上传进度显示 -->
        <div class="mask" v-if="fileItem.raw?.status === 'progress'"
          v-loading="fileItem.raw?.status === 'progress' && fileItem.raw?.progress === 0">
          <el-progress color="#13ce66" text-color="#fff" :width="80" type="circle"
            :percentage="fileItem.raw?.progress || 0">
          </el-progress>
        </div>
        <!-- 上传失败显示 -->
        <div class="mask" v-if="fileItem.raw?.status === 'fail'">
          <div class="fail-info">
<!--            <i class="el-icon-warning fail-icon"></i>-->
            <el-icon class=" fail-icon">
              <Warning></Warning>
            </el-icon>
            <span class="fail-text"> 上传失败 </span>
            <span class="retry" @click="retryFile(fileItem)">
<!--              <i class="el-icon-refresh"></i>-->
              <el-icon class="el-icon-refresh">
                <Refresh></Refresh>
              </el-icon>
              重试
            </span>
          </div>
        </div>
        <slot name="file-item" :item="fileItem">
          <!-- 图片文件 -->
          <div class="image-item" v-if="getFileType(fileItem) === 'image'">
            <el-image style="width: 100%; height: 100%" fit="contain" hide-on-click-modal preview-teleported
              :preview-src-list="[getFileUrl(fileItem)]" :src="getFileUrl(fileItem)">
            </el-image>
          </div>
          <div class="common-item video-item" v-else-if="getFileType(fileItem) === 'video'"
            @click="previewFile(fileItem)">
<!--            <i class="play-icon el-icon-caret-right"-->
<!--               v-if="fileItem.raw?.status !== 'progress' && fileItem.raw?.status !== 'fail'"-->
<!--             ></i>-->
            <el-icon class="play-icon"  v-if="fileItem.raw?.status !== 'progress' && fileItem.raw?.status !== 'fail'">
              <CaretRight></CaretRight>
            </el-icon>
            <video style="width: 100%;height: 100%" :src="getFileUrl(fileItem)"></video>
          </div>
          <!-- 其他类型的文件 -->
          <a class="common-item" v-else target="_blank" @click="previewFile(fileItem)">
            <el-image fit="contain" style="width: 100%; height: 100%"
              :src="getFileTypeImage(fileItem.name || '')"></el-image>
          </a>
          <!-- 文件信息 -->
          <div class="file-info">
            <div class="file-name"><a target="_blank" :href="getFileUrl(fileItem)">{{ fileNameShow(fileItem) }}</a></div>
            <div class="file-size">
              <span v-if="fileItem.fileSize">
                {{ getFileSize(fileItem.fileSize || 0) }}
              </span>
              <i class="el-icon-loading" v-if="fileSizeLoading.data[`${fileItem.url}_${index}`]"></i>
            </div>
          </div>
        </slot>
      </div>
      <div class="upload-btn" v-if="props.standalone ? true : showUploadBtn" @click="clickChooseFile"
        :data-has-list="Boolean(state.fileList.length) && !props.standalone">
        <slot name="upload-btn">
          <div class="plus-btn">
            <!--            <i class="plus-icon el-icon-plus"></i>-->
            <el-icon :size="24" class="plus-icon">
              <Plus></Plus>
            </el-icon>
          </div>
        </slot>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Plus, CircleCloseFilled, Refresh, Warning,CaretRight } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import { computed, onMounted, reactive, useSlots, watch } from 'vue';
import type { UploadAnyFile, UploadAnyProps, UploadAnySate } from './type';
import { getFileTypeImage } from './assets';
import {
  FileType,
  fileTypes,
  getFileExtension,
  getFileSize,
  getFileSizeByFetch,
  getFileTypeFromFilename,
} from './utils';
import { ElMessage, ElMessageBox, } from 'element-plus';
// import {UploadProgress} from '@/utils/fileUploadFragmentation';
import { mediaFilePreview } from "../mediaFilePreview";
import { AxiosRequestConfig } from "axios";
import {
  BeforeNormalUploadPayload,
  onBeforeNormalUploadFuncList
} from "./configUpload";



// 组件的props
const props = withDefaults(defineProps<UploadAnyProps>(), {
  multiple: false,
  // 默认限制500M大小文件
  sizeLimit: 1024 * 1024 * 500,
  limit: 1,
  chunk: 'auto',
  disabled: false,
  standalone: false,
});

const emit = defineEmits<{
  // 每个文件上传成功触发一次
  (e: 'success', file: UploadAnyFile, fileList: UploadAnyFile[]): void;
  // 每个文件发生错误（包含中断）触发一次
  (e: 'error', file: UploadAnyFile, fileList: UploadAnyFile[]): void;
  // 每次上传行为结束触发一次
  (e: 'done', fileList: UploadAnyFile[]): void;
}>();


// 如果使用了fileItem的slot，那么.file-item的width就不能定死
const hasFileItemSlot = !!useSlots()['file-item'];

// 组件的状态
const state = reactive<UploadAnySate>({
  // 当前是否正在运行上传操作
  uploading: false,
  // 透传一份列表
  fileList: props.fileList || [],
});
// 监听fileList，外部fileList指针变化，更新fileList
watch(
  () => props.fileList,
  v => {
    if (v && v instanceof Array) {
      state.fileList = v as UploadAnyFile[];
    }
  }
);

// 计算给input的accept属性
const inputAccept = computed(() => {
  const resultList = getAllowedFileExtensionList();
  if (resultList.length) {
    return resultList.map(i => `.${i}`).join(',');
  } else {
    return '*';
  }
});

// 获取组件允许的所有文件格式类型限制数组，将结合fileType和accept
function getAllowedFileExtensionList() {
  const resultList = [] as string[]
  if (props.accept && props.accept instanceof Array) {
    resultList.push(...props.accept);
  }
  if (props.fileType) {
    resultList.push(...getAcceptListFromFileType(props.fileType))
  }
  return resultList;
}

// 根据fileType预设类型获取accept数组
function getAcceptListFromFileType(fileType: FileType | FileType[]) {
  let fileTypeList: string[]
  if (fileType instanceof Array) {
    fileTypeList = fileType.map(i => fileTypes[i]).flat();
  } else {
    fileTypeList = fileTypes[props.fileType as FileType];
  }
  return fileTypeList;
}

function fileNameShow(file: UploadAnyFile) {
  if (file.name) {
    return file.name
  }
  // 如果没有，根据url获取
  const url = file.url
  if (!url) {
    return ''
  }
  const urlSplit = url.split('/')
  return urlSplit[urlSplit.length - 1]
}

function getFileType(file: UploadAnyFile) {
  return getFileTypeFromFilename(file.name || file.url || '')
}

const inputMultiple = computed(() => {
  return props.multiple && props.limit > 1;
});

// 判断是否能显示上传按钮，当禁用、或者文件列表已经达到上限时，不显示
const showUploadBtn = computed(() => {
  return !props.disabled && state.fileList.length < props.limit;
});

// const bucketModuleName = computed(() => {
//   return props.bucketModuleName || 'business';
// });

// 点击文件的删除
function deleteFile(index: number) {
  const file = state.fileList[index];
  // 组装message的html
  const messageHtml = `确定移除文件<span style="color:#f56c6c">（${fileNameShow(file)}）</span>吗？`;
  // 弹出确认
  ElMessageBox.confirm(messageHtml, '移除文件确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    dangerouslyUseHTMLString: true,
    type: 'warning',
  })
    .then(async () => {
      // 确认删除
      if (file.raw && file.raw.abortController instanceof AbortController) {
        file.raw.abortController.abort();
      }
      // 如果文件在上传中，取消上传
      state.fileList.splice(index, 1);
    })
    .catch((e: any) => {
      console.error(e);
    });
}

// let inputElement: HTMLInputElement | null;
// 点击选择文件
function clickChooseFile() {
  chooseFile()
}
// 根据组件定义的属性开启选择文件对话框
function chooseFile() {
  // 这里采用js创建input标签, 不再直接渲染input
  const inputElement = document.createElement('input');
  inputElement.type = 'file';
  inputElement.multiple = inputMultiple.value;
  inputElement.accept = inputAccept.value;
  inputElement.onchange = fileInputChange;
  inputElement.click();
}
// 手动取消上传
function cancelAllUpload() {
  state.fileList.forEach(file => {
    if (file.raw) {
      file.raw.abortController.abort();
    }
  });
}
// 通用传入文件上传方法, 这个方法直接给外部使用或者给fileInputChange使用
async function inputFiles(files: File[]) {
  const rawFileList = files;
  // 校验当前文件列表数量是否超出limit，超出就按照顺序截断
  // 需要加上当前已经存在的fileList长度
  const fileLenNow = state.fileList.length + rawFileList.length;
  if (fileLenNow > props.limit) {
    rawFileList.splice(props.limit - state.fileList.length);
  }
  const accept = getAllowedFileExtensionList();
  // 校验文件类型,不符合的就剔除，并提示
  for (const file of rawFileList) {
    if (accept.length) {
      const fileExtension = getFileExtension(file.name);
      if (!accept.includes(fileExtension!)) {
        ElMessage.warning(
          `上传文件${file.name}不符合要求，仅支持${accept.join(',')}格式`
        );
        rawFileList.splice(rawFileList.indexOf(file), 1);
        continue
      }
    }
    // 判断sizeLimit
    if (file.size > props.sizeLimit!) {
      const sizeLimitText = getFileSize(props.sizeLimit);
      ElMessage.warning(
        `上传文件${file.name}不符合要求，文件大小不能超过${sizeLimitText}`
      );
      rawFileList.splice(rawFileList.indexOf(file), 1);
    }
  }
  // 组装fileList
  const fileList: UploadAnyFile[] = rawFileList.map(file => {
    const abortController = new AbortController();
    return {
      name: file.name,
      fileSize: file.size,
      fileExtension: getFileExtension(file.name),
      url: '',
      raw: {
        file: file,
        localUrl: '',
        status: 'ready',
        progress: 0,
        response: null,
        abortController: abortController,
        abortSignal: abortController.signal,
      },
    };
  });
  fileList.forEach(item => {
    const file = item.raw?.file;
    if (!file) return;
    item.raw!.localUrl = getLocalDataUrlFromFile(file);
  });
  // 追加到fileList
  state.fileList.push(...fileList);
  await createUpload();
}
// 用户选择了上传文件
function fileInputChange(e: Event) {
  const inputEl = <HTMLInputElement>e.target;
  if (!inputEl) return;
  const files = inputEl.files || [];
  if (files.length === 0) {
    return;
  }
  const rawFileList = Array.from(files);
  inputFiles(rawFileList);
  // 清空input的值, 并消除inputEl
  inputEl.value = '';
  inputEl.remove();
  // inputElement = null;
}
// 创建上传文件
async function createUpload(fileList?: UploadAnyFile[]) {
  // 循环遍历state.fileList,根据文件大小决定使用normalUpload还是chunkUpload
  const forceChuck = props.chunk === true;
  const autoChuck = props.chunk === 'auto';
  // 如果使用autoChuck，文件大小超过一定大小就使用分片上传
  const fileSizeToUseChuck = 1024 * 1024 * 10;
  const fileListToUpload = fileList || state.fileList;
  const taskList: any[] = [];
  fileListToUpload.forEach(file => {
    if (file.raw?.status === 'ready') {
      if (
        forceChuck ||
        (autoChuck && (file.fileSize as number) > fileSizeToUseChuck)
      ) {
        taskList.push(chunkUpload(file));
      } else {
        taskList.push(normalUpload(file));
      }
    }
  });
  await Promise.allSettled(taskList);
  emit('done', state.fileList);
}

/**
 * 普通上传
 * @param file
 */
async function normalUpload(file: UploadAnyFile) {
  file.raw!.progress = 0;
  // const rawFile = file.raw!.file;
  try {
    file.raw!.status = 'progress';
    state.uploading = true;
    const formData = new FormData();
    // 都交给外部自定义上传行为和表单内容
    // formData.append('file', rawFile);
    // formData.append('modules', bucketModuleName.value);
    const onBeforeUploadPayload: BeforeNormalUploadPayload = {
      // uploadAnyProps是只读的
      file: file,
      uploadAnyProps: Object.freeze(JSON.parse(JSON.stringify(props))),
      formData,
      method: 'post',
      url: '',
      additionalHeader: {},
      // 传入用户自定义上下文，供beforeUploadPayload使用
      userContext: props.userContext || null,
    }
    // 调用全局beforeUpload
    const funcList = onBeforeNormalUploadFuncList
    for (let i = 0; i < funcList.length; i++) {
      const func = funcList[i]
      await func(onBeforeUploadPayload)
    }
    // 如果组件自定义了beforeNormalUpload，再运行一次
    if (props.beforeNormalUpload && typeof props.beforeNormalUpload === 'function') {
      await props.beforeNormalUpload(onBeforeUploadPayload)
    }
    // 调用beforeUpload后，如果url还是空的，那么就使报错
    if (!onBeforeUploadPayload.url) {
      throw new Error('[uploadAny] url is empty after onBeforeUpload')
    }
    // 组装最后使用的数据
    const data = onBeforeUploadPayload.formData
    const url = onBeforeUploadPayload.url
    const headers = onBeforeUploadPayload.additionalHeader
    const method = onBeforeUploadPayload.method
    const [res, e] = await FetchData({
      url,
      method,
      data,
      headers:{
        ...headers,
        'Content-Type': 'multipart/form-data'
      } ,
      onUploadProgress: (progressEvent: any) => {
        file.raw!.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      },
      signal: file.raw!.abortSignal,
    } as AxiosRequestConfig);
    if (e) throw e
    file.raw!.status = 'success';
    file.raw!.response = res;
    updateFileId(file);
    updateFileUrl(file);
    emit('success', file, state.fileList);
  } catch (err) {
    file.raw!.status = 'fail';
    console.error(err);
    emit('error', file, state.fileList);
  } finally {
    checkUploading();
  }
}

/**
 * 分片上传
 * @param file
 */
async function chunkUpload(file: UploadAnyFile) {
  return normalUpload(file)
  // TODO: 实现分片上传
  // const rawFile = file.raw!.file;
  // try {
  //   state.uploading = true;
  //   const task = new UploadProgress(rawFile, {
  //     abortSignal: file.raw!.abortSignal,
  //     // 分片上传指定储存桶名称
  //     module: bucketModuleName.value,
  //   });
  //   task.onProgress((e: any) => {
  //     const percent = Math.round((e.loaded * 100) / e.total);
  //     file.raw!.progress = percent || 0;
  //   });
  //   file.raw!.status = 'progress';
  //   const res = await task.upload();
  //   file.raw!.status = 'success';
  //   file.raw!.response = res;
  //   file.id = res.data.id
  //   updateFileUrl(file);
  //   emit('success', file, state.fileList);
  // } catch (err) {
  //   file.raw!.status = 'fail';
  //   emit('error', file, state.fileList);
  // } finally {
  //   checkUploading();
  // }
}
// 检测所有文件是否都上传完成,并更新state.uploading
function checkUploading() {
  state.uploading = state.fileList.some(file => {
    const status = file.raw?.status;
    return status === 'progress';
  });
}
// 更新文件的id
function updateFileId(file: UploadAnyFile) {
  file.id =
    file.raw?.response?.data?.id ||
    file.raw?.response?.data?.name ||
    ''
}
// 将raw中的url更新到file.url
function updateFileUrl(file: UploadAnyFile) {
  file.url =
    file.raw?.response?.link ||
    file.raw?.response?.url ||
    file.raw?.response?.data?.url ||
    '';
}
// 绑定UI上显示的url
function getFileUrl(file: UploadAnyFile) {
  return file.url || file.raw?.localUrl || '';
}
// 生成本地预览用的url
function getLocalDataUrlFromFile(file: File) {
  return URL.createObjectURL(file);
}
// 点击其他类型的文件
// function clickCommonFile(file: UploadAnyFile) {
//   // 直接组装链接进行跳转
//   const url = getFileUrl(file);
//   window.open(url);
// }
async function retryFile(file: UploadAnyFile) {
  file.raw!.status = 'ready';
  await createUpload([file]);
}
// 获取文件列表
function getFileList() {
  return state.fileList;
}
// 判断是否正在上传
function isUploading() {
  return state.uploading;
}
// 是否文件列表均上传成功（或已经包含url）
function isAllFileSuccess() {
  return state.fileList.every(file => {
    if (file.hasOwnProperty('raw')) {
      return file.raw!.status === 'success' && file.url;
    }
    return Boolean(file.url);
  });
}
// 预览一般文件
function previewFile(file: UploadAnyFile) {
  const url = getFileUrl(file);
  const name = fileNameShow(file) || '';
  const fileType = getFileTypeFromFilename(name);
  // 如果fileType不是video或者audio，那么直接下载
  const previewAble = ['video', 'audio'].includes(fileType || '');
  if (!previewAble) {
    const url = getFileUrl(file)
    // 都使用a标签的download重命名文件下载（不同域下从命名会失效）
    const a = document.createElement('a');
    a.download = name || ''
    a.href = url
    a.click()
    return;
  }
  mediaFilePreview(url, {
    title: name ? `文件预览-${name}` : '',
    previewType: fileType,
  })
}
onMounted(async () => {
  await ensureFileSizeInfo()
})

// 自动更新fileSize的loading
const fileSizeLoading = reactive({
  data: props.fileList?.reduce((acc, file) => {
    const index = props.fileList?.indexOf(file)
    acc[`${file.url}_${index}`] = false
    return acc
  }, {} as Record<any,any>) || {}
})

// 自动检测文件列表中的文件是否都有fileSize，如果没有自动获取
async function ensureFileSizeInfo() {
  const taskList = state.fileList.map(async (file, index) => {
    if (!file.fileSize) {
      // loading
      fileSizeLoading.data[`${file.url}_${index}`] = true;
      fileSizeLoading.data = { ...fileSizeLoading.data }
      file.fileSize = await getFileSizeByFetch(file.url) || undefined
      fileSizeLoading.data[`${file.url}_${index}`] = false;
      fileSizeLoading.data = { ...fileSizeLoading.data }
    }
  })
  await Promise.allSettled(taskList)
}

// fileList参数和state中的fileList变化都执行fileSize更新检测
watch(() => props.fileList, async () => {
  await ensureFileSizeInfo()
})
watch(() => state.fileList, async () => {
  await ensureFileSizeInfo()
})
// 供外部使用的函数方法
defineExpose({
  cancelAllUpload,
  chooseFile,
  inputFiles,
  createUpload,
  getFileList,
  isUploading,
  isAllFileSuccess,
});
</script>
<style lang="scss">
@use "style";
</style>
<style scoped lang="scss">
.upload-any {

  :deep(.el-progress__text){
    color: #fff;
  }

  &[data-standalone='false'] {
    padding-top: 10px;
  }

  display: flex;
  align-items: flex-start;

  .upload-btn {
    &[data-has-list='true'] {
      margin-left: 15px;
    }

    &[data-standalone='false'] {
      margin-top: 10px;
    }

    .plus-btn {
      height: 80px;
      width: 80px;
      border-radius: 20px;
      border: dashed 1px var(--uploadAny-btn-color);
      cursor: pointer;
      display: grid;
      place-items: center;

      &:hover {
        --uploadAny-btn-color: var(--uploadAny-active-color);
      }

      .plus-icon {
        font-size: 24px;
        color: var(--uploadAny-btn-color);
      }
    }
  }

  .file-list {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;

    .file-item {
      &[data-has-file-item-slot='true'] {
        width: auto;
        min-width: var(--uploadAny-file-item-size-width);
      }

      width: var(--uploadAny-file-item-size-width);
      position: relative;

      &:hover {
        .delete-btn {
          display: block;
        }
      }

      .delete-btn {
        display: none;
        --color: red;
        z-index: 3;
        position: absolute;
        top: -10px;
        right: -10px;
        width: 25px;
        height: 25px;
        background: #fff;
        border-radius: 50%;
        border: none;
        border-color: var(--color);

        .icon {
          position: absolute;
          right: -1.3px;
          bottom: -0.8px;
          font-size: 28px;
          color: var(--color);
          cursor: pointer;
        }
      }

      .mask {
        background: rgba(0, 0, 0, 0.5);
        z-index: 2;
        position: absolute;
        height: 100%;
        width: 100%;
        display: grid;
        place-items: center;

        .percentage-value {
          color: #fff;
          font-size: 16px;
        }

        .fail-info {
          display: grid;
          place-items: center;
        }

        .retry {
          cursor: pointer;
          color: #fff;
          font-size: 12px;
        }

        .fail-icon {
          font-size: 24px;
          color: red;
        }

        .fail-text {
          color: red;
        }
      }
    }

    .image-item {
      padding: 5px;
      height: var(--uploadAny-file-item-size-height);
      width: var(--uploadAny-file-item-size-width);
      background: var(--uploadAny-image-item-bg);
    }

    .common-item {
      display: block;
      padding: 5px;
      height: var(--uploadAny-file-item-size-height);
      width: var(--uploadAny-file-item-size-width);
      cursor: pointer;
      background: var(--uploadAny-image-item-bg);
    }

    .video-item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        .play-icon {
          // 放大效果
          transform: scale(1.2);
        }
      }

      .play-icon {
        z-index: 2;
        position: absolute;
        font-size: 40px;
        color: #ac3c3c;
        // 给个阴影
        text-shadow: 0 0 10px #000;
        transition: all 0.3s ease-in-out;
      }
    }

    .file-info {
      padding: 0 5px;
      width: 100%;
      overflow: hidden;
      color: #abacaf;
      font-size: 12px;

      .file-name {
        width: 100%;
        // 文本允许换行
        word-break: break-all;
        overflow: hidden;
        text-align: center;
        text-wrap: balance;
        // 最多2行省略
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        line-height: 18px;
      }

      .file-size {
        line-height: 18px;
        width: 100%;
        margin-left: 5px;
        text-align: center;

      }
    }
  }
}
</style>
