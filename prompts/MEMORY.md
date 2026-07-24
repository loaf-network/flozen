# Agent Memory

本文件为 Agent 的记忆入口，记录项目中积累的决策、规范和经验。Agent 读取此文件以获取上下文。

## 分类文档

以下文档位于 `prompts/` 目录下，按主题分类存储具体记忆：

- `USER_INTERFACE.md` — UI 界面
- `NCM_API.md` — 网易云音乐 API 文档

## 通用规则

- 界面设计风格：中国互联网审美（暖色调、有温度的卡片、柔和阴影、品牌色点缀），参考网易云音乐/QQ音乐的设计语言。有节制地使用渐变和品牌色装饰元素。
- 符合精致、高级与流畅的审美特点，多使用暗色暖灰底，品牌色为暖珊瑚/琥珀红（`--primary: oklch(0.62 0.17 22)` 暗色模式）。避免纯黑白灰的冷感 Vercel 风格。
- 在保证运行流畅、不卡顿与高帧数的前提下，追求界面质感。
- UI 开发尽量采用 `Tailwind CSS v4` + `shadcn-vue v2` 的已有解决方案。
- 图标统一使用 `@lucide/vue`，不要手写 SVG。
- 界面尽量简洁，代码尽量精简。
- 全部使用 shadcn-vue 组件，颜色全部使用语义令牌。
- **提示通知统一使用 sonner**（`vue-sonner` + shadcn-vue Toaster），不用 console.error/alert。`<Toaster />` 放在 `App.vue`。
- 不要在 `App.vue` 里写过多内容。
- 编写组件前检查是否有类似组件可复用。仅单页面使用的组件放在 `src/components/<page>/` 下。
- 中文字体：系统默认字体栈 `system-ui, "PingFang SC", "Microsoft YaHei"`，不使用 Google Fonts Inter
- 不使用 `tracking-tight/tighter`（对中文无效），统一使用 `tracking-normal`
- 不使用 `backdrop-blur` 玻璃拟态效果（属 Web3/Western SaaS 审美）

## 经验积累

- shadcn-vue 组件安装: `npx shadcn-vue@latest add <组件名> --yes`
- 已安装: button, card, checkbox, radio-group, badge, separator, label, switch, avatar, sonner, input
- vue-router v4，安装: `npm install vue-router@4 --legacy-peer-deps`
- Tauri Store: `@tauri-apps/plugin-store` (npm) + `tauri-plugin-store` (Rust)
- NCM API: `VITE_API_NCM_BASE` 环境变量
- NCM realIP: 所有请求自动附加 `realIP` 参数，IP 通过 `https://api.ipify.org` 获取并缓存在 Store
- NCM 二维码登录: `/login/qr/key` → `/login/qr/create` → 轮询 `/login/qr/check`
- NCM 用户信息: `getNcmAccount(cookie)`
- NCM 退出登录: `ncmLogout()`（调用 `/logout` 接口）
- NCM 搜索: `ncmSearch(keywords)` / `ncmSearchSuggest(keywords)` / `ncmSearchHot()` / `ncmSongUrl(id)`
- NCM API 字段名: 搜索结果使用 `ar`(artists) / `al`(album) / `dt`(duration)，不是 `artists` / `album` / `duration`
- API 已模块化: `src/lib/api/request.ts`（通用 POST）+ `ncm.ts`（NCM Provider）+ `index.ts`（统一导出）
- Tauri 项目 JSON/Rust 文件不能有 BOM
- Card 组件自带 `py-6 gap-6`，做列表容器时需 `py-0 gap-0 overflow-hidden` 覆盖
- 设置页列表模式: Card + Separator + 等高按钮行，间距统一 px-4 py-3.5
- PowerShell 不支持 `head`，用 `Select-Object -First N`
- ESLint + Prettier: `eslint.config.js` (flat config) + `.prettierrc` (4 空格缩进)，`npm run lint` 纠错+格式化
- 页面过渡动画: `router.beforeEach` 按路径深度设 `meta.transition`（slide-left/right/fade/player），App.vue + AppLayout.vue 用 `<Transition :name>` 包裹 `<RouterView v-slot>`
- 播放器架构: `src/lib/player.ts` 导出 `player` reactive 单例（非 composable），全局共享 Audio 实例
- 歌词 LRC 格式: `[mm:ss.xx]歌词内容`，parseLrc 正则解析并排序，getCurrentLine 二分查找当前行
- Tauri 窗口 API: `@tauri-apps/api/window` 的 `appWindow.minimize()` / `appWindow.close()`，ZenIsland 中用动态 import 避免非 Tauri 环境报错
- NCM 歌曲 URL: `/song/url/v1`, level 参数控制音质（standard/higher/exhigh/lossless/hires）
- NCM 歌词: `/lyric`, 返回 `lrc.lyric`（LRC 格式字符串）
- NCM 歌单: `/user/playlist`（用户歌单列表）, `/playlist/detail`（含部分 tracks）, `/playlist/track/all`（全部 tracks）, `/playlist/create`, `/playlist/delete`, `/playlist/tracks?op=add|del`

## 工作总结

### 最近完成

- **全功能播放器实现**（从零构建）：
  - NCM API 扩展（ncm.ts）：+9 个函数（歌词、歌单 CRUD、收藏、歌曲详情）
  - 全局播放器 Store（player.ts）：HTMLAudioElement + reactive 单例，播放/暂停/上下首/队列/进度/音量/音质/循环/随机
  - 歌词解析（lyrics.ts）：LRC 格式 parseLrc + getCurrentLine 实时同步
  - ZenIsland（ZenIsland.vue）：顶部歌词岛，左 Flozen + 中歌词/歌手歌名悬浮切换 + 右自定窗口控制（最小化/关闭 Tauri API）
  - 歌词面板（LyricsPanel.vue）：clip-path 半齿轮锯齿效果 + 当前行高亮放大 + 自动滚动
  - 播放控制栏（PlayerControls.vue）：进度条可点击拖拽 + 播放/暂停/上下首/循环/随机/音量 slider + 收藏
  - 播放页（Player.vue）：全屏独立路由 /player，模糊封面背景 + 旋转封面动画 + 优美过渡动画
- **歌单管理**：Playlists.vue（用户歌单列表+新建+播放全部）+ PlaylistDetail.vue（歌单详情+歌曲列表+删除）
- **Appearance 丑态修复**：max-w-xl 居中 + Card 独立按钮卡片化 + 选中态 bg-accent + 去硬编码渐变
- 侧边栏新增歌单入口 + Search/Grid/Wall 连接播放器（router.push("/player")）
- 路由新增 /player + /app/playlists + /app/playlists/:id，播放页特殊过渡动画

### 项目结构 (模块化)

```
src/
├── router/index.ts
├── pages/
│   ├── Landing.vue              # 首次引导 (介绍→主题→隐私)
│   ├── Home.vue                 # 主页 (欢迎+快速操作+最近播放)
│   ├── Player.vue               # 播放页 (全屏独立路由，ZenIsland+歌词+封面+控制栏)
│   ├── Search.vue               # 搜索页 (平铺/歌单墙切换)
│   ├── Settings.vue             # 设置入口 (列表)
│   ├── Playlists.vue            # 歌单列表 (新建+播放全部)
│   ├── PlaylistDetail.vue       # 歌单详情 (歌曲列表+删除)
│   └── settings/                # (LNProfile, 3RDAccount, Appearance, Privacy, About)
├── components/
│   ├── SplashScreen.vue
│   ├── AppLayout.vue            # 侧边栏+内容区 (首页/搜索/歌单/设置)
│   ├── SongGrid.vue
│   ├── SongWall.vue
│   ├── player/
│   │   ├── ZenIsland.vue        # 歌词岛 (Flozen+歌词/歌名+窗口控制)
│   │   ├── LyricsPanel.vue      # 歌词面板 (半齿轮锯齿)
│   │   └── PlayerControls.vue   # 播放控制栏
│   └── ui/                      # shadcn-vue 组件
├── lib/
│   ├── api/                     # API 模块化 (request.ts + ncm.ts + index.ts)
│   ├── player.ts                # 全局播放器 Store (AudioElement + reactive)
│   ├── lyrics.ts                # LRC 歌词解析
│   └── store.ts                 # Tauri Store 持久化
```

### 路由

- `/` → Splash (检查 onboarded → /landing 或 /app)
- `/landing` → 3 段引导
- `/player` → **播放页**（独立全屏路由，优美过渡动画）
- `/app` → AppLayout
    - `/app` → Home
    - `/app/search` → Search
    - `/app/playlists` → **歌单列表**
    - `/app/playlists/:id` → **歌单详情**
    - `/app/settings` → Settings 列表
    - `/app/settings/loaf` → Loaf Network 账号
    - `/app/settings/ncm` → 第三方平台账号
    - `/app/settings/appearance` → 外观
    - `/app/settings/privacy` → 隐私
    - `/app/settings/about` → 关于

### 设计风格 (中国互联网审美，暖珊瑚品牌色)

- 品牌色：暖珊瑚/琥珀红（`oklch(0.62 0.17 22)` 暗色），渐变为 `from-primary to-orange-500`
- Landing: 暖黑背景 `#0d0c0b`，品牌色 Logo 辉光，Badge 品牌色微底，主题卡片品牌色 glow
- SplashScreen: 暖黑背景，品牌色 Logo 容器，装饰线暖色渐变
- Settings: 各分类图标不同低饱和底色（蓝/红/紫/绿/灰），Card 容器 + Separator，`rounded-2xl` 列表项
- Home: 品牌色 `bg-primary/8` 图标容器，`rounded-2xl` 空状态
- 侧边栏: 品牌色渐变 Logo，导航 `w-10 h-10 rounded-xl`，激活态 `bg-primary/10 text-primary`
- 搜索页: 搜索框 focus 品牌色 ring，热搜前 3 名品牌色区分，下拉 `rounded-2xl shadow-2xl`
- SongGrid: 去 backdrop-blur，播放按钮 `bg-black/30`，卡片 shadow 多层柔和
- SongWall: 去 backdrop-blur+点阵纹理，暖灰卡底 `#141312`，自由漂浮+弹簧吸附最近卡片
- 全局：系统字体栈，`tracking-normal`，`--radius: 0.75rem`，移除所有 `backdrop-blur`

### Store 字段

- `onboarded`, `theme`, `ncmCookie`, `ncmProfile` (UserProfile), `clarity`, `realIP`（缓存用户公网 IP，用于 NCM API 请求）

### 已知问题

- 播放器点击搜索/歌单中的歌曲后需手动导航到 /player（未来可改自动跳转）
- Landing.vue 引导页完成后未检查 onboarded 状态
- SplashScreen.vue 启动逻辑需完善（检查 onboarded → 路由跳转）
- LNProfile.vue Loaf Network 账号页面尚未实现（仅有 logo 和链接占位）
- MiniPlayer 迷你播放条尚未实现
- 歌单增删歌曲功能尚未在详情页中暴露 UI
- 收藏功能 UI 已就位但 /like API 未集成