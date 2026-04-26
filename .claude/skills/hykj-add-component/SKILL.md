---
name: hykj-add-component
description: 在 hykj-js monorepo 任一子包中新增一个模块/组件/hook 的标准流程。包含目录骨架、index 桶式导出、global-extend.d.ts、play 联调验证。当用户要求"新增 xxx 工具/组件/hook 到 shared/uniapp/vue3-hooks/vue3-element-plus"时使用。
---

# 在 hykj-js 中新增组件/模块

## 步骤

1. **选择目标子包**：`shared`（通用浏览器）/ `uniapp`（uniapp 平台）/ `vue3/hooks`（组合 API）/ `vue3/packages/element-plus`（vue3 + element-plus 组件）
2. **建目录**：`<pkg>/components/<name>/`，至少包含 `index.ts`
3. **写实现**：函数/类放 `.ts`，vue 组件放 `<name>.vue`，类型独立到 `type.ts`
4. **桶式导出**：在 `<pkg>/index.ts` 末尾追加 `export * from './components/<name>'`
5. **如需扩展全局类型**：在该模块目录建 `global-extend.d.ts`，写法见 `shared/components/dayjs/global-extend.d.ts`，**不要**在 index.ts 显式 import，构建脚本会自动注入到 dist
6. **vue 组件需 install**：`index.ts` 内 `import { withInstall } from '../../utils/install'`，`export const Foo = withInstall(CP)`，并在 `installer.ts` 加入 components 数组
7. **play 联调**：根目录 `pnpm play`，play 通过 alias 直连源码，立即可见
8. **类型检查 + build**：`pnpm --filter <pkg> run build`（= `tsc --noEmit && vite build`）

## 关键要点

- vue3-hooks 的代码必须 `import ... from 'vue-demi'`，不要直接 'vue'
- 公共导出加 JSDoc，遵循 `docs/spec.md`
- 错误处理用元组返回（参考 `HttpUtil.FetchData` 的 `[data, error, res]`）
- 跨子包 import 走包名（`@hykj-js/shared`），不要用相对路径

## 模块依赖红线

`shared` 不依赖任何子包；`uniapp` / `vue3-hooks` 只依赖 `shared`；`vue3-element-plus` 依赖 `shared` + `vue3-hooks`。新增内容若违反此关系，应放到下游子包或拆出新子包。

## 验收清单

- [ ] `<pkg>/index.ts` 已 re-export
- [ ] `pnpm play` 中可以使用
- [ ] `pnpm --filter <pkg> run build` 通过
- [ ] 若有 global-extend，构建后 `dist/index.d.ts` 末尾有 `export * from './components/<name>/global-extend'`
- [ ] 公共 API 有 JSDoc
