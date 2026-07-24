# Agent Memory

本文件为 Agent 的记忆入口，记录项目中积累的决策、规范和经验。Agent 读取此文件以获取上下文。

## 分类文档

以下文档位于 `prompts/` 目录下，按主题分类存储具体记忆：

- `USER_INTERFACE.md` — UI 界面
- `NCM_API.md` — 网易云音乐 API 文档

## 通用规则

- 符合精致、高级与流畅的审美特点，多使用暗色（黑白，形成强烈对比），不要使用彩色渐变（AI 味很浓）。
- 在保证运行流畅、不卡顿与高帧数的前提下，追求界面质感。
- UI 开发尽量采用 `Tailwind CSS v4` + `shadcn-vue v2` 的已有解决方案。
- 图标统一使用 `@lucide/vue`，不要手写 SVG。
- 界面尽量简洁，代码尽量精简。
- 全部使用 shadcn-vue 组件，颜色全部使用语义令牌。
- 不要在 `App.vue` 里写过多内容。
- 编写组件前检查是否有类似组件可复用。仅单页面使用的组件放在 `src/components/<page>/` 下。
- 参考 Apple 设计风格：简洁、留白、层次分明、微妙的动画。

## 经验积累

- shadcn-vue 组件安装: `npx shadcn-vue@latest add <组件名> --yes`
- 已安装: button, card, checkbox, radio-group, badge, separator, label, switch, avatar
- vue-router v4，安装: `npm install vue-router@4 --legacy-peer-deps`
- Tauri Store: `@tauri-apps/plugin-store` (npm) + `tauri-plugin-store` (Rust)
- NCM API: `VITE_API_NCM_BASE` 环境变量
- NCM 二维码登录: `/login/qr/key` → `/login/qr/create` → 轮询 `/login/qr/check`
- NCM 用户信息: `/user/account?cookie=xxx`
- Tauri 项目 JSON/Rust 文件不能有 BOM
- Card 组件自带 `py-6 gap-6`，做列表容器时需 `py-0 gap-0 overflow-hidden` 覆盖
- 设置页列表模式: Card + Separator + 等高按钮行，间距统一 px-4 py-3.5
- PowerShell 不支持 `head`，用 `Select-Object -First N`
- ESLint + Prettier: `eslint.config.js` (flat config) + `.prettierrc` (4 空格缩进)，`npm run lint` 纠错+格式化

## 工作总结

### 项目结构 (模块化)

```
src/
├── router/index.ts
├── pages/
│   ├── Landing.vue              # 首次引导 (介绍→主题→隐私)
│   ├── Home.vue                 # 主页 (欢迎+快速操作+最近播放)
│   ├── Settings.vue             # 设置入口 (列表)
│   └── settings/
│       ├── Profile.vue          # Loaf Network 账号 (Apple ID 风格)
│       ├── Account.vue          # 第三方平台账号 (NCM 二维码登录)
│       ├── Appearance.vue       # 外观 (主题切换)
│       ├── Privacy.vue          # 隐私 (政策 + Clarity)
│       └── About.vue            # 关于 (版本+链接+依赖+版权)
├── components/
│   ├── SplashScreen.vue         # 启动过渡 (品牌感+动画)
│   └── AppLayout.vue            # 侧边栏+内容区
├── lib/
│   ├── api.ts                   # NCM API 封装
│   └── store.ts                 # Tauri Store
```

### 路由

- `/` → Splash (检查 onboarded → /landing 或 /app)
- `/landing` → 3 段引导 (Apple 风格)
- `/app` → AppLayout (macOS Finder 风格侧边栏)
    - `/app` → Home (欢迎+快速操作+最近播放)
    - `/app/settings` → Settings 列表
    - `/app/settings/profile` → Loaf Network 账号
    - `/app/settings/account` → 第三方平台账号
    - `/app/settings/appearance` → 外观
    - `/app/settings/privacy` → 隐私
    - `/app/settings/about` → 关于

### 设计风格 (Apple 风格)

- Landing: 大标题 text-7xl，毛玻璃 Logo 容器，半透明 Badge
- SplashScreen: 分层 stagger 动画，渐变装饰线
- Settings: Card 容器 + Separator 分隔，图标 40px 圆角方块
- Home: 欢迎语 + 快速操作卡片 + 最近播放占位
- 侧边栏: macOS Finder 风格，子路由高亮支持

### Store 字段

- `onboarded`, `theme`, `ncmCookie`, `ncmProfile` (UserProfile), `clarity`
