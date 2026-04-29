# hykj-js

hykj 自用的 JavaScript / TypeScript 工具库 monorepo，面向浏览器与 uni-app 运行时，提供前端开发中常用的基础设施、Vue 3 组合式 API、Element Plus 增强组件，以及配套的 AI 协作文档（Claude Code Skills）。

## 包含的库

| 包名 | 版本 | 说明 |
|---|---|---|
| `@hykj-js/shared` | ![npm](https://img.shields.io/npm/v/@hykj-js/shared) | 核心工具库：HTTP 请求、日志、存储、高德地图、dayjs、通用函数 |
| `@hykj-js/uniapp` | ![npm](https://img.shields.io/npm/v/@hykj-js/uniapp) | uni-app 适配器：axios 桥接 `uni.request`、文件上传下载、平台判断 |
| `@hykj-js/vue3-hooks` | ![npm](https://img.shields.io/npm/v/@hykj-js/vue3-hooks) | Vue 3 组合式 API：通用列表、字典翻译、状态重置、开关切换 |
| `@hykj-js/vue3-element-plus` | ![npm](https://img.shields.io/npm/v/@hykj-js/vue3-element-plus) | Element Plus 增强组件：BaseTable、UploadAny、DictInput、文件预览 |
| `@hykj-js/skills` | ![npm](https://img.shields.io/npm/v/@hykj-js/skills) | Claude Code Skills，指导 AI 编程助手正确使用上述各库 |

### @hykj-js/shared

核心工具库，被其他所有包依赖。

- **HttpUtil** — 基于 axios 的元组式请求工具，`FetchData` 返回 `[data, error, response]`，避免 try/catch
- **loglevel** — 日志级别管理，注入 `globalThis.logger`
- **storage** — localStorage 封装，自动 JSON 序列化
- **aMap** — 高德地图 JSAPI 加载器，支持 Vite 代理配置
- **dayjs** — dayjs 初始化（中文 locale，默认格式 `YYYY-MM-DD HH:mm:ss`）
- **ObjectResolver** — 批量去抖解析器，合并多次查询为单次请求，带缓存
- **common** — `randomNum`、`delay`、`safeJSONParse`、`maskString`、`findInTree` 等通用函数

### @hykj-js/uniapp

在 uni-app 工程中使用 axios 生态，并提供平台工具。

- **uniappAxiosAdapter** — axios 适配器，将请求转发到 `uni.request` / `uni.uploadFile` / `uni.downloadFile`
- **请求错误提示** — 解析 `HttpRequestError` 并通过 `uni.showToast` 展示
- **文件下载/上传** — 跨平台文件操作（H5 / 微信小程序 / App）
- **平台判断** — 条件编译，区分 App、小程序、浏览器环境
- **storage** — 同步存储封装（`uni.getStorageSync` 系列）

### @hykj-js/vue3-hooks

Vue 3 组合式 API，减少列表、字典、状态管理的样板代码。

- **useCommonList** — 通用列表 Hook，内置分页、加载态、瀑布流拼接、并发锁
- **useList** — 在 useCommonList 基础上集成删除确认对话框
- **translate / dictTranslate** — 字典翻译系统，支持本地/远程字典、全局响应式
- **DictInput** — 字典选择组件（select / radio / checkbox）
- **useResettableState / useResettableRef** — 可重置响应式状态
- **useCommonToggle** — 布尔开关 Hook

### @hykj-js/vue3-element-plus

基于 Element Plus 的增强组件，以 Vue 插件形式安装。

- **BaseTable** — 列配置驱动的表格组件，内置分页、列持久化、字典翻译、排序、多选
- **UploadAny** — 通用文件上传组件，支持图片/文档/音视频/压缩包，批量检验
- **DictInput** — 字典选择输入组件，联动 vue3-hooks 字典系统
- **mediaFilePreview** — 函数式文件预览（图片/视频/音频/PDF），弹窗嵌入式播放
- **loadingConfirm** — Element Plus MessageBox 的加载态确认对话框
- **requestErrorMessage** — 解析 `HttpRequestError` 并用 `ElMessage.error()` 展示

### @hykj-js/skills

提供 8 个 Claude Code Skill 文档，覆盖上述所有库的使用指南。AI 编程助手在安装这些 Skill 后可以正确生成符合 hykj-js 规范的代码。

## AI 协作技能安装

`@hykj-js/skills` 提供了命令行工具 `hykj-skills`，将技能文档安装到工程中。

### 安装

```bash
npx @hykj-js/skills add --all
```

此命令会将所有 Skill 安装到 `.claude/skills/` 目录（Claude Code 默认加载路径）。

### 支持的目标工具

```bash
# 安装到 Claude Code（默认）
npx @hykj-js/skills add --all

# 安装到 Cursor
npx @hykj-js/skills add --all --target cursor

# 安装到 Codex CLI
npx @hykj-js/skills add --all --target codex

# 安装到 Gemini CLI
npx @hykj-js/skills add --all --target gemini

# 安装到 GitHub Copilot
npx @hykj-js/skills add --all --target copilot
```

### 其他命令

```bash
npx @hykj-js/skills list          # 列出所有可用技能
npx @hykj-js/skills targets       # 列出支持的目标工具及说明
npx @hykj-js/skills add hykj-http hykj-dict  # 选择性安装部分技能
```

### 可用技能

| 技能名称 | 说明 |
|---|---|
| `hykj-http` | HttpUtil 元组式请求、拦截器、错误处理 |
| `hykj-shared-utils` | dayjs、loglevel、storage、通用工具函数、ObjectResolver |
| `hykj-amap` | 高德地图 JSAPI 加载与配置 |
| `hykj-uniapp` | uni-app 适配器、文件操作、平台判断 |
| `hykj-base-table` | BaseTable 增强表格组件 |
| `hykj-dict` | 字典翻译系统与 DictInput 组件 |
| `hykj-element-plus-utils` | UploadAny、loadingConfirm、mediaFilePreview 等 |
| `hykj-use-list` | useCommonList 分页/瀑布流列表 Hook |

## 安装与使用

```bash
# 安装全部
pnpm install

# 在本地 playground 联调
pnpm play

# 构建全部子包
pnpm build
```

### 依赖关系

```
shared（独立）
  └── uniapp（依赖 shared）
  └── vue3-hooks（依赖 shared）
        └── vue3-element-plus（依赖 shared + vue3-hooks）
```

## License

Proprietary — hykj 内部使用。
