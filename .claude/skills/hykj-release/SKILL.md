---
name: hykj-release
description: hykj-js 子包发布到 npm 的标准流程。涵盖版本号变更、依赖联动、CI 触发条件、本地手动发布。当用户说"发布 shared/uniapp/vue3-hooks/vue3-element-plus"或"打 tag 发版"时使用。
---

# hykj-js 子包发版

## 子包与版本字段

| 子包 | npm 名 | 路径 |
|------|--------|------|
| shared | `@hykj-js/shared` | `shared/package.json` |
| uniapp | `@hykj-js/uniapp` | `uniapp/package.json` |
| vue3-hooks | `@hykj-js/vue3-hooks` | `vue3/hooks/package.json` |
| vue3-element-plus | `@hykj-js/vue3-element-plus` | `vue3/packages/element-plus/package.json` |

## 步骤

1. **改版本号**：编辑对应 `package.json` 的 `version`（语义化）
2. **联动依赖（重要）**：若发布的是被其他包依赖的（最常见 `shared`），检查下游 `package.json` 的 `dependencies` / `peerDependencies` 中 `@hykj-js/shared` 是否还能匹配新版本（workspace:^ 默认匹配，无需改；如手填了具体版本则要改）
3. **commit + push**：commit message **必须包含 `bump[<pkg>]`** 才会触发 CI，如：
   ```
   feat: 新增 BaseTable 排序 bump[vue3-element-plus]
   ```
4. **触发方式（任选其一）**：
   - commit message 含 `bump[<pkg>]` 推到 default 分支（GitLab CI）
   - 推 release 分支或打 tag（GitHub Actions），tag 形如 `shared_v0.2.11`
   - GitLab 网页手动 pipeline + 选择 PACKAGE 变量
5. **本地手动发布**（备用）：根目录 `pnpm publish:<pkg>`；或一次发全部：`pnpm publish:all`（顺序：shared → uniapp → vue3-hooks → vue3-element-plus）
6. **校验**：`npm view @hykj-js/<pkg> version` 确认新版本已上架

## 风险与确认

- **不要 amend 已 push 的 commit** — 会破坏 CI 触发判断
- **顺序敏感**：发 vue3-element-plus 之前必须先发 shared 与 vue3-hooks 的对应版本
- 发布前本地先跑 `pnpm build:<pkg>` 确认产物 OK
- npm token 配置：`~/.npmrc` 中 `//registry.npmjs.org/:_authToken=...`
