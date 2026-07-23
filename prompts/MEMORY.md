# Agent Memory

本文件为 Agent 的记忆入口，记录项目中积累的决策、规范和经验。Agent 读取此文件以获取上下文。

## 分类文档

以下文档位于 `prompts/` 目录下，按主题分类存储具体记忆：

- `USER_INTERFACE.md` — UI 界面
- `NCM_API.md` — 网易云音乐 API 文档（GitHub: NeteaseCloudMusicApiEnhanced/api-enhanced）

## 通用规则

- 符合精致、高级与流畅的审美特点，多使用暗色（黑白，形成强烈对比），不要使用彩色渐变（AI 味很浓）。
- 在保证运行流畅、不卡顿与高帧数的前提下，追求界面质感。此原则贯穿整个程序（前端 UI、后端逻辑、交互体验等），而非仅限于界面。
- UI 开发尽量采用 `Tailwind CSS v4` + `shadcn-vue v2` 的已有解决方案。
- 非用户要求下，图标统一使用 `@lucide/vue`，不要手写 SVG。
- 界面尽量简洁，代码尽量精简，不要太复杂。
- 不要抄其他产品的设计，保持自己的风格。
- 全部使用 shadcn-vue 组件，不要写自定义样式（除非布局需要），颜色全部使用语义令牌。

## 经验积累

- shadcn-vue 组件安装: `npx shadcn-vue@latest add <组件名> --yes`
- 已安装组件: button, card, checkbox, radio-group, badge, separator, label, switch
- shadcn-vue 规范: 使用语义色令牌、`cn()` 条件类名、`gap-*` 代替 `space-*`、`size-*` 代替 `w-* h-*`
- vue-router 使用 v4 版本（v5 需要 vite ^7+），安装: `npm install vue-router@4 --legacy-peer-deps`
- 路由使用 `createWebHashHistory`（Tauri 适配更好）
- 项目目录结构: `src/router/` (路由), `src/pages/` (页面), `src/components/` (组件)
- Tauri v2 splashscreen 参考: https://tauri.app/learn/splashscreen/（后续对接）

## 工作总结

### 落地页 (Landing.vue) — 全屏滚动分段
- **状态**: 已完成，全部使用 shadcn-vue 组件 + 语义令牌
- **文件**: `src/pages/Landing.vue`, `src/components/SplashScreen.vue`, `src/router/index.ts`
- **路由**: `/` → SplashScreen (2s 后跳转), `/landing` → Landing
- **布局**: 全屏 scroll-snap 分段，每段占一屏，底部有向下滚动提示
- **3 个段落**:
  1. 项目介绍 — Music 图标 + 标题 + 3 个 Badge 特性标签
  2. 选择音乐平台并登录 — Card 内 4 个 Button 平台卡片 + 登录按钮
  3. 隐私与数据 — Card 内 Checkbox 同意隐私 + Switch Clarity + 启动按钮
- **图标**: `@lucide/vue` (Music, ChevronDown, Globe, Headphones, ListMusic, Radio, Check)
- **shadcn-vue 组件**: Button, Card, Badge, Separator, Checkbox, Switch, Label
- **样式**: 全部使用语义令牌 (bg-background, text-foreground, text-muted-foreground, bg-card, border-border, text-primary, bg-primary/5)
- **待办**: 登录功能实现、Tauri splashscreen 对接、保存设置逻辑
