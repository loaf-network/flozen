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
- 已安装: button, card, checkbox, radio-group, badge, separator, label, switch, avatar, sonner, input, skeleton
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
- 歌单内存缓存（playlistCache.ts）: getCachedDetail/setCachedDetail + getCachedList/setCachedList，TTL 10 分钟，避免每次访问都请求 Vercel serverless（冷启动慢）；手动刷新按钮和新建歌单后 force=true 绕过缓存
- 播放队列拖拽排序 moveQueueItem: 移除项后 splice 插入目标位置，queueIndex 同步规则——`from===queueIndex→to`；`from<queueIndex && to>=queueIndex → -1`；`from>queueIndex && to<=queueIndex → +1`
- **系统媒体控件方案（重要）**: 桌面端直接用浏览器标准 `navigator.mediaSession`（WebView2 自动映射到 Win SMTC，含封面/进度/上下首/seekto），零 Rust 依赖；移动端 `tauri-plugin-media-session` 0.2.4（仅暴露 Rust 方法 `MediaSessionExt`，自写 command 包装见 smtc_mobile.rs）。**勿用 `tauri-plugin-media` 0.1.1**：其 Windows 实现用 MediaPlayer+CommandManager 模式，SMTC 会话根本注册不出来（实测「未知应用」无元数据），且会与 WebView2 为 `<audio>` 自建的会话冲突
- **重要**：Tauri v2 的 `@tauri-apps/api/window` 没有 `appWindow`（v1 API），要用 `getCurrentWindow()`。ZenIsland 曾用 v1 API 导致最小化/关闭按钮静默失效
- SMTC 进度同步性能：不能每帧 IPC，rAF 里用 `performance.now()` 节流 2 秒推一次 position；元数据仅切歌时全量推
- **capability 权限需按平台拆分**：桌面编译时移动插件的权限不存在（反之亦然），`media:default` 放 `capabilities/desktop.json`（platforms: windows/macOS/linux）、`media-session:default` 放 `capabilities/mobile.json`（platforms: android/iOS），混放 default.json 会导致 cargo build 失败

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
- **播放页液体流动背景**（Player.vue）：封面四象限取色 → 4 个色团（blob），border-radius 形变 + 位移缩放 + 外层慢旋转模拟液体流动；仅动画 transform/border-radius 保证性能；暂停播放时 `animation-play-state: paused` 静止。增强版：取色亮度归一化（最亮通道拉到 165）+ 色团 `mix-blend-mode: screen` 发光 + 位移幅度 ~1.5-2 倍 + 周期 8-15s + 旋转 36s + 遮罩降至 0.18
- **AppHeader 歌词切换过渡**：歌词 `<p>` 的 key 绑定 `player.currentLyricIndex`，歌词行变化时触发已有 hdr-text 上滑淡入过渡
- **侧边栏页面过渡改渐隐渐显**：同父级路由切换由 fade-vertical 改为 fade，并移除 style.css 中的 fade-vertical 样式；AppLayout 的 `<Transition>` 需加 `mode="out-in"`，否则新旧页面同时渲染上下堆叠，视觉上像滑动
- **重要**：`<Transition mode="out-in">` 要求页面组件必须单根节点。PlaylistDetail.vue 原为多根（v-if 链 + 注释编译成 Fragment）导致过渡卡死（页面不显示、无法切换），已包一层 `<div class="h-full">` 修复。新页面组件一律保持单根模板
- **重要**：歌词自动滚动不能用 `scrollIntoView`（会连带滚动所有可滚动祖先，最后一句歌词时把整页顶下去）。Player.vue 已改为对 `.lyrics` 容器手动 `scrollTo(offsetTop - clientHeight/2 + offsetHeight/2)`，并给 `.lyrics` 加 `position: relative` 保证 offsetTop 基准正确
- **播放队列面板**（PlayQueuePanel.vue）：右侧抽屉（Teleport to body + 半透明遮罩点击关闭），展示 player.queue；当前播放高亮 `color-mix(in oklch, var(--primary) 12%, transparent)`；HTML5 draggable 拖拽排序；逐项删除 + 清空；接入 PlayerControls.vue 的 ListMusic 按钮（原占位变可用，激活态 primary 色）。player.ts 新增 `moveQueueItem(from, to)` / `clearQueue()`
- **SMTC/系统媒体控件适配**：桌面 `navigator.mediaSession`（WebView2 原生映射 SMTC）+ 移动 tauri-plugin-media-session；`src/lib/smtc.ts` 前端适配层（getPlatform 缓存 + initMedia 单次注册媒体键 action handler + updateMedia/clearMedia 分平台分发）；player.ts 集成（切歌推元数据+封面 `?param=300y300`、play/pause 推状态、rAF 节流 2s 推进度、clearQueue 清空）；媒体键 play/pause/previoustrack/nexttrack/stop/seekto 反控播放器；`smtc_mobile.rs` 移动端 command 包装；lib.rs 加 `get_platform` command。曾用 tauri-plugin-media 0.1.1 实测失败后移除
- **窗口标题动态更新**：播放时 `{歌名} - {艺术家} · Flozen`，无歌曲回退 `Flozen`（player.ts 的 setWindowTitle，getCurrentWindow().setTitle）
- **修复 ZenIsland Tauri v1 API 残留**：`appWindow` → `getCurrentWindow()`，窗口控制按钮恢复可用
- **AppHeader 播放页融合**：播放页时头部 `position: absolute` 悬浮在播放页背景之上（透明背景无边框，`.app-root` 加 `position: relative`），消除顶部黑/白条；同时播放页隐藏头部中间歌词/歌名区域（`v-if="!onPlayer"`）
- **播放页底部抽屉过渡**：App.vue 顶层 `<Transition>` 改为动态 `:name="route.meta.transition"`，player/player-back 过渡不用 `out-in`（新旧页面同时渲染，离场页绝对定位重叠），其余保持 `out-in` fade。进入：播放页 `translateY(100%)` 滑上（z-index 200 盖过头部），主界面 `scale(0.94)+brightness(0.55)+圆角`；返回对称滑下。**注意 44px 头部补偿**：进入时头部脱离文档流，离场主界面 `top: 44px`；返回时头部回流，离场播放页 `top: -44px`。缓动 `cubic-bezier(0.32, 0.72, 0, 1)`（iOS sheet 风格）
- **重要（过渡类被 scoped 样式覆盖的坑）**：全局过渡类（style.css 无 layer）与组件 scoped 样式同为 unlayered，按特异性比较——Player.vue `.root[data-v-x]` (0,2,0) 高于 `.player-back-leave-active` (0,1,0)，导致离场时 `position: absolute` 被 scoped 的 `position: relative; height: 100%` 覆盖、页面滑动错乱。修复：定位属性加 `!important` 并显式 `height: calc(100% + 44px)`。Tailwind 工具类在 @layer utilities 内，天然输给 unlayered 全局类，无此问题
- **头部按钮闪现修复**：`.app-header.is-player` 加 `animation: hdr-appear 0.3s ease 0.45s both`（透明→不透明），等抽屉滑上完成后头部才淡入，避免返回键/窗口按钮在旧页面上闪现
- **独显渲染偏好（仅 Windows）**：lib.rs 新增 `list_gpus`（PowerShell Get-CimInstance Win32_VideoController）、`get_gpu_preference` / `set_gpu_preference`（reg.exe 读写 `HKCU\Software\Microsoft\DirectX\UserGpuPreferences`，值 `<exe路径>=GpuPreference=2;`，重启生效）；前端 `src/lib/gpu.ts`（正则区分独显/核显）；Appearance.vue「渲染」区块 Switch，无独显时禁用
- **重要（WebView2 独显）**：注册表 GpuPreference 只影响主进程，WebView2 渲染在独立子进程（msedgewebview2.exe）不受影响！必须在 WebView 创建前设置环境变量 `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--force_high_performance_gpu`（WebView2 运行时 145+ 支持，见 lib.rs `apply_gpu_preference_env`，run() 开头按注册表偏好注入）
- **播放页按钮恒白**：`.is-player` 的返回键/窗口按钮删除了浅色模式黑色覆盖规则，无论浅/深色主题均为白色（播放页背景恒为深色）
- **播放页液体背景开关**：store.ts 配置新增 `fluidBg`（默认 true）；Appearance.vue「播放页」区块 Switch；Player.vue onMounted 读配置，关闭时 `v-if` 不渲染 .fluid 色团（保留静态模糊封面背景）
- **首页最近播放自适应**：`grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`，最多显示 12 条；标题行右侧清除键（Trash2 + 文字，仅有记录时显示），player.ts `clearHistory()` 清空并持久化
- **播放页无歌曲占位**：封面区 `v-else` 渲染同尺寸 `.cover--empty`（暖灰渐变底 + 居中 Music 图标），信息区显示「未在播放」占位文案，避免左列无歌曲时布局变形
- **独显开关检测态**：Appearance.vue `detecting` 状态——检测中区块显示「正在检测显卡...」且 Switch 禁用，检测完成后启用（无独显时切换会 toast 警告并回退）；默认关闭
- **主题选择三列自适应**：Appearance.vue 主题区由垂直列表改为 `grid grid-cols-1 sm:grid-cols-3 gap-2`，卡片竖排（图标上、标题描述下），选中勾标绝对定位右上角
- **首页最近播放骨架屏**：player.ts 导出 `historyLoaded` ref（restorePlayerState 加载历史后置 true）；Home.vue 未加载时显示 8 个 Skeleton 占位（同网格布局），加载完成后再判断列表/空态
- **歌词进入居中**：Player.vue `autoScroll(smooth = true)`，onMounted 时 `autoScroll(false)` 瞬时居中当前行；watch 回调需显式 `() => autoScroll()`，避免 watch 新值误传给 smooth 参数
- **播放状态持久化**：`src/lib/playerPersist.ts`（store 文件 `flozen-player.json`，键 `snapshot`/`history`）；player.ts 启动时 `restorePlayerState()` 恢复队列/索引/音量/音质/循环/随机/进度（不自动播放，`resumeTime` + `pendingSeek` 在 loadedmetadata 时 seek，恢复后首次 play() 检测 `!audio.src` 走续播分支）；保存时机：watch 队列等字段 debounce 800ms + rAF 每 10s 存进度 + pause 时立存；播放历史 `playHistory`（去重置顶、上限 100 条），loadAndPlay 成功即 `recordHistory`；Home.vue 最近播放已接入（前 8 条，点击播放并跳转 /player）

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