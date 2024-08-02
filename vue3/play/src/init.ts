// 一些启动前需要的操作
import { 初始化本地字典, 定义翻译数据 } from "@/utils/dictTranslate.init";
import { polyfillStructuredClone, initDayjs } from "@hykj-js/shared";
// import { onBeforeNormalUpload } from '@hykj-js/vue3-element-plus'
import { initHttpUtil } from "@/utils/httpUtil.init";
import type { App } from "vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

export async function main(app: App) {
  // dayjs
  initDayjs();
  // polyfillStructuredClone
  polyfillStructuredClone();
  // 初始化全局http请求工具
  initHttpUtil();
  // 初始化字典翻译工具
  初始化本地字典();
  定义翻译数据();
  // // 上传组件uploadAny配置
  // onBeforeNormalUpload(payload => {
  //   // 加入file文件字段
  //   if (payload.file!.raw?.file) {
  //     payload.formData.append('file', payload.file.raw.file)
  //   }
  //   // 加入桶名称
  //   payload.formData.append(
  //     'modules',
  //     payload.uploadAnyProps.bucketModuleName || ''
  //   )
  //   // 定义上传文件
  //   payload.url = '/file/upload'
  //   payload.method = 'post'
  // })
  // element的icon

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  await Promise.all([
    import("element-plus/dist/index.css"),
    // import("@hykj-js/vue3-element-plus/dist/style.css"),
  ]);
}
