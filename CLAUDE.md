# CLAUDE.md

本文件是为 AI 协作助手准备的工程入门指引。读完即可独立完成本仓库内的修改、构建、发布等任务。

## 项目定位

`hykj-js` 是 hykj 自用的 JavaScript / TypeScript 工具库 monorepo，使用 **pnpm workspace** 管理，4 个子包发布到 npm（`@hykj-js/*`），1 个本地 playground 应用（`play`）用于真实 Vue3 环境下的联调。

所有子包都是浏览器或 uniapp 运行时，不是 Node 库。构建产物均为 ES module（`formats: ['es']`），由各包的 `vite.config.ts` + `vite-plugin-dts` 产出。

## 仓库布局

```
hykj-js/
├── shared/                       # @hykj-js/shared - 浏览器通用工具（HttpUtil/dayjs/aMap/loglevel/storage/...）
├── uniapp/                       # @hykj-js/uniapp - uniapp 平台工具（axios 适配器/文件/平台条件编译）
├── vue3/
│   ├── hooks/                    # @hykj-js/vue3-hooks - vue3 组合 API（useCommonList/useResettable/translate/...）
│   ├── packages/element-plus/    # @hykj-js/vue3-element-plus - element-plus 增强组件（BaseTable/UploadAny/DictInput/...）
│   └── play/                     # 内部 playground，不发布
├── utils/                        # 构建脚手架脚本（dts global-extend 注入、uniapp 条件编译还原）
└── package.json                  # 根 workspace 脚本
```

`pnpm-workspace.yaml` 包含：`shared`、`vue3/packages/*`、`vue3/hooks`、`vue3/play`、`uniapp`。

## 子包依赖关系

```
shared （独立）
  └── uniapp （依赖 shared）
  └── vue3-hooks （依赖 shared）
        └── vue3-element-plus （依赖 shared + vue3-hooks）
              └── play （依赖以上三个，源码 alias 直连）
```

`play` 的 `vite.config.ts` 用 alias 将 `@hykj-js/shared|vue3-hooks|vue3-element-plus` 直接映射到源码 `index.ts`，无需先 build 即可联调。

## 常用命令

根目录运行：

```bash
pnpm install                       # 安装
pnpm play                          # 启动 playground (端口 50000)
pnpm build                         # 全量 build（排除 play）
pnpm build:shared                  # 单独 build shared
pnpm build:vue3-hooks              # 自动 build:shared 后再 build hooks
pnpm build:vue3-element-plus       # 自动 build hooks → element-plus
pnpm build:uniapp                  # 自动 build shared → uniapp
pnpm publish:all                   # 顺序发布全部子包到 npm
```

各子包内的 `pnpm build` = `tsc --noEmit`（类型检查）+ `vite build`（产物）。

## 构建关键约定

### `global-extend.d.ts` 模式

子包的某些模块需要扩展全局类型（例如 `Window.aMapConfig`、全局 `dayjs`、全局 `FetchData`）。规则：

1. 模块目录下放 `global-extend.d.ts`，使用 `declare global { ... } export {}` 包裹
2. **不要**在 `index.ts` 中显式 import 该文件
3. `utils/afterDtsBuild.ts` 的 `checkGlobalExtendAfterDtsBuild` 在 dts 构建后会：
   - 把每个 `components/<name>/global-extend.d.ts` 复制到 `dist/components/<name>/`
   - 在 `dist/index.d.ts` 末尾追加 `export * from './components/<name>/global-extend'`

新增需要扩展全局类型的模块时，仅需放置 `global-extend.d.ts`，构建脚本自动处理。

### uniapp 条件编译还原

`@hykj-js/uniapp` 中 `components/config/platform.ts` 使用 uniapp 条件编译注释（`// #ifdef ...`）。Vite 构建会丢弃这些注释，因此 `utils/restoreUniappIfDef.ts` 在 dts afterBuild 阶段把 `platform.ts` 中 `ifDefPlatform` 函数原文回写到 `dist/index.js`。

修改 `platform.ts` 中的条件编译块时，要注意 `ifDefPlatform` 函数体格式：必须能被正则 `/function ifDefPlatform\(\) {([\s\S]*?)}/` 匹配。

### Vite 库构建模板

每个子包的 `vite.config.ts` 形态一致：

- `build.lib`：`entry: 'index.ts'`、`formats: ['es']`、`fileName: 'index'`
- `rollupOptions.external`：声明所有运行时依赖（避免被打包进产物）
- `rollupOptions.output.globals`：与 external 一一对应
- `plugins: [dts({ afterBuild: checkGlobalExtendAfterDtsBuild })]`
- `minify: false`、`sourcemap: true`

新增子包按此模板复制即可。

## 发布流程

1. 改 `package.json` 中对应子包的 `version`
2. CI（`.gitlab-ci.yml`）通过以下方式触发：
   - commit message 含 `bump[<pkg>]`（如 `bump[shared]`）
   - tag 含 `<pkg>` 前缀（如 `shared_v0.2.11`）
   - 或网页手动选择 `PACKAGE` 变量
3. GitHub Actions（`.github/workflows/`）也镜像了相同发布流程，触发条件：push 到 `release` 分支或对应 tag
4. 本地手动发布：`pnpm publish:<pkg>`（需 `~/.npmrc` 已配置 token）

`@hykj-js/shared` 因被其他包依赖（workspace），发布前请确保依赖方的 `package.json` 引用版本与即将发布的版本一致。

## 编码约定

通用：

1. **错误处理优先用元组返回**（`[data, error]`），上层避免 try/catch（参考 `HttpUtil.FetchData`）
2. **条件分支优先策略 / map / 早返回（guard clauses）**，避免 else if 链
3. 所有 Node / 工具脚本使用 **ES Module**；非 npm 包目录下脚本使用 `.mjs`，整体 ESM 工程内的少量 CJS 用 `.cjs`
4. 异步使用 `async/await`，不使用 promise 链或回调

TypeScript：

- 子包 `tsconfig.json` 当前 `target: ES2020`、`module: ESNext`、`moduleResolution: node`，`noEmit: true`（产物由 vite/dts 出）
- vue 子包通过 `vue-demi` 兼容 vue2/3，不要直接 `from 'vue'`，应 `from 'vue-demi'`
- 公共导出函数请写 JSDoc（参考 `commonList.ts`、`HttpUtil.ts`）

文件命名：

- 组件目录形如 `components/<name>/index.ts`，对应 vue 文件用 PascalCase 或 camelCase（参考已有，如 `dictInput.vue`）
- 类型文件 `type.ts`，样式 `style.scss`，资源 `assets/`

## 文档规范

参见 [`docs/spec.md`](./docs/spec.md)。

## AI 协作注意事项

- 修改源码后**先在 play 验证**：`pnpm play`，play 通过 alias 直连源码，改动立即可见
- 修改 `shared` 的导出需要同步检查 `uniapp` / `vue3-hooks` / `vue3-element-plus` 是否使用
- 不要在 `dist/` 直接改东西，所有产物由 build 生成
- 不要轻易修改 `utils/afterDtsBuild.ts` 与 `utils/restoreUniappIfDef.ts`，它们是构建关键路径
- 公共工具偏函数式 + 可测、不引入新依赖时优先复用 `lodash-es` / `dayjs` / `axios`
- 提交信息使用中文 + `feat:/fix:/misc:` 前缀（参考 `git log`），不要写无意义的 changelog
