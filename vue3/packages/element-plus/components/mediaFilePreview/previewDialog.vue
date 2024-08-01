<template>
  <el-dialog
      class="cp-file-preview-dialog"
    v-model="visible"
    append-to-body
    :title="titleText"
    width="50vw"
    height="50vh"
    top="20px"
    :close-on-click-modal="false"
  >
    <el-empty description="暂无内容" v-if="!props.previewUrl || !props.previewType"/>
<!--    <iframe-->
<!--      v-else-->
<!--      :src="props.previewUrl"-->
<!--      frameborder="0"-->
<!--      width="100%"-->
<!--      height="100%"-->
<!--    ></iframe>-->
    <video class="player" ref="videoPlayer" v-if="props.previewType === 'video'" autoplay :src="props.previewUrl" controls></video>
    <audio class="player" ref="audioPlayer" v-else-if="props.previewType === 'audio'" autoplay :src="props.previewUrl" controls></audio>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, ref, watch} from "vue-demi";
import {ElEmpty, ElDialog} from 'element-plus';
import {previewDialogBus} from "./event";
interface Props {
  // 对话框标题
  title?: string,
  // 预览的地址路径
  previewUrl?: string,
  // 预览的文件类型：目前系统不支持直接kkfile预览，本组件只用于预览音频和视频
  previewType?: 'video' | 'audio' | 'document' | 'archive' | string
}

const props = defineProps<Props>()
const videoPlayer = ref<HTMLVideoElement>()
const audioPlayer = ref<HTMLAudioElement>()
const visible = ref(false)
const titleText = computed(() => {
  return props.title || '文件预览'
})
function open(){
  visible.value = true
}
watch(()=>visible.value, (newVal)=>{
  if(!newVal){
    previewDialogBus.emit('close')
  }
})
onBeforeUnmount(()=>{
  // 置空媒体文件src，销毁播放器，否则系统仍然会将该文件作为待播放状态，电脑触发快捷键播放时还会继续播放
  if(videoPlayer.value){
    videoPlayer.value!.pause()
    videoPlayer.value!.src = ''
    videoPlayer.value!.remove()
  }
  if(audioPlayer.value){
    audioPlayer.value!.pause()
    audioPlayer.value!.src = ''
    audioPlayer.value!.remove()
  }
})
defineExpose({
  open
})
</script>

<style lang="scss">
.cp-file-preview-dialog{
  display: flex;
  flex-direction: column;
  .el-dialog__body{
    flex: 1;
    padding: 20px;
    overflow: hidden;
    .player{
      max-height: 70vh;
      width: 100%;
    }
  }
}
</style>
