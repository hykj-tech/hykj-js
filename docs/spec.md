# 文档与代码规范 SPEC

适用于本仓库（`hykj-js`）所有子包的代码、注释、README 与发布说明。

## 一、目录与命名

- 子包公共导出**统一从** `<pkg>/index.ts` 桶式 re-export，不允许跨子包深路径 import
- 模块单元放在 `components/<name>/index.ts`，类型 `type.ts`，样式 `style.scss`
- 全局类型扩展统一文件名 `global-extend.d.ts`，按 `declare global { ... } export {}` 模板
- vue 单文件组件文件名首字母小写驼峰（沿用 `dictInput.vue`/`uploadAny.vue` 既有风格），导出符号首字母大写（`DictInput`、`UploadAny`）

## 二、TypeScript 风格

- **导出 API 必须显式标注参数与返回类型**；内部辅助可省
- **优先元组返回**：`Promise<[Data, Error]>` 或 `[Data, Error]`，避免上层包 try/catch
- **条件分支**：guard clauses + map / Record 策略；禁止两层以上 else if
- 类型与值的 import 分离：`import type { Foo } from '...'`
- 跨 vue2/3 的代码统一 `import ... from 'vue-demi'`
- 公共类型加 JSDoc 注释，能在编辑器悬浮看到说明

## 三、注释

- 仅写解释 **WHY** 的注释；不写复述代码的注释
- 公共函数 / 导出类使用 JSDoc，按 `@param` `@returns` 标注
- 临时 hack / workaround 必须写明原因（链接 issue 或问题描述）
- 不写"该函数在 X 流程使用"这类引用注释，会随调用方变动腐烂

## 四、错误处理

参考 `shared/components/http/HttpUtil.ts`：

```ts
const [data, err, res] = await FetchData<UserDTO>({ url: '/api/user' })
if (err) {
  // 业务侧根据 err.isAfterSuccess / err.isTimeout / err.isAbort 判断
  return
}
// 使用 data
```

- 业务错误统一抛 / 返回 `HttpRequestError`
- 用户主动 abort、超时、HTTP 状态错误、业务校验错误**都通过 type 字段区分**，不通过 message 文案区分

## 五、global-extend.d.ts 规范

```ts
// shared/components/foo/global-extend.d.ts
import type { SomeType } from './index'

declare global {
  interface Window {
    foo: SomeType
  }
  const foo: SomeType
}

export {}
```

- 文件**必须**以 `export {}` 结尾，否则不是 module，`declare global` 不生效
- 不要在 `index.ts` import 该文件，由构建脚本注入

## 六、Vue 组件

- 组件支持按需引入：每个组件 `index.ts` 用 `withInstall` 包装
- props 定义带 `Props` 类型导出（`BaseTableProps`、`UploadAnyProps`），方便外部使用
- 触发的事件列表通过 `defineEmits` 显式声明
- 样式仅在 `.vue` 文件用 `<style scoped>` 或独立 `style.scss`，不在 ts 中拼字符串

## 七、组合 API（Hooks）

- 命名 `use<Topic>`，返回 reactive / ref 必须在文档说明
- 销毁逻辑（`watchEffect` 副作用、定时器）放 `onScopeDispose`
- 不要在 hook 内调用 `onMounted` 等生命周期，除非明确文档说明只能在 setup 中调用

## 八、README 与变更日志

- 每个子包根 `README.md` 至少包含：用途一句话、安装、最小用例（一个代码块）
- API 详情写在 `docs/<pkg>.md` 或源码 JSDoc，避免 README 变成长文档
- 重大变更通过 commit message 与 tag 体现，不维护 `CHANGELOG.md`

## 九、Markdown 写作

- 代码块前后需空行（钉钉文档兼容）
- 中文与代码 / 数字之间留半角空格（除标点外）
- 只用 ATX 标题（`#`），不用下划线 / `===`
- 一级标题仅文档开头一次

## 十、提交信息

- 中文描述，前缀 `feat:` / `fix:` / `misc:` / `docs:` / `refactor:`
- 涉及发版：在 commit message 中加入 `bump[<pkg>]` 触发对应 CI

示例：

```
feat: BaseTable 支持服务端排序 bump[vue3-element-plus]
```
