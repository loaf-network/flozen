# Agent Guide of Flozen

本文件为 AI Agent 提供项目操作手册与约束清单，确保 Agent 行为可控、可复现。

## 项目概述

Flozen 是基于 Tauri v2 + Vue 3 的跨平台音乐播放器，适配 Windows、MacOS、Android 与 iOS 等市场主流操作系统，不包括由 HUAWEI 开发的 HarmonyOS NEXT 系统。

### 开发特点

项目使用模块化开发方式，通过拆分成不同的模块来实现各种功能，给予用户高度可玩性：

- 多音乐平台支持，通过模块化的方式，支持网易云音乐、酷狗音乐等音乐平台（把单个音乐平台称为provider）
- ....

### 核心功能

- 搜索歌曲
- 播放歌曲
- 歌曲歌词展示
- 在线歌单 / 本地歌单
- 程序在线更新（通过 GitHub）
- 歌曲列表展示

### 项目信息

- GitHub 仓库: `https://github.com/loaf-network/flozen`

## 目录结构

```
.
├── README.md               # 项目主文档
├── AGENTS.md               # 项目 Agent 指令（本文件）
├── index.html              # HTML 入口
├── package.json            # npm 依赖与脚本
├── vite.config.ts          # Vite 配置（端口 1420）
├── tsconfig.json           # TypeScript 配置
│
├── src/                    # 前端源码（Vue 3）
│   ├── components/         # Vue 组件
│       ├── ui/             # shadcn/vue 组件
│   │
│   ├── pages/              # 主要页面
│   ├── router/             # vue-router 文件夹
│       ├── index.ts             # vue-router 入口
│   │
│   ├── App.vue             # 根组件（问示例）
│   ├── main.ts             # 应用入口
│   ├── App.vue             # 根组件（问示例）
│
├── src-tauri/              # 后端源码（Rust + Tauri v2）
├── public/                 # 静态资源
│
├── prompts/                # 提示词约束
│   ├── MEMORY.md           # 记忆入口
│
└── .agents/skills/         # Agent 技能（shadcn-vue）
```

## 命令

```bash
npm run dev &rem 启动 Vite 开发服务器（端口 1420)
npm run build &rem 类型检查 + 构建
npm run lint &rem ESLint 纠错 + Prettier 格式化（4 空格缩进）
npm run tauri &rem 转发到 Tauri CLI（如 `tauri dev`）
```

## 提示词

- 在开始对话前，先读取 `prompts/MEMORY.md` 并遵循该记忆文档

## 记忆协议

当用户向你发送了包括但不限于“我希望你”“我喜欢”“记住这一点”等同类表达认可的语言时：

1. 判断用户认可的具体内容属于的类型（如界面设计、程序实现等）。
2. 将无法归类的结论追加至 `prompts/MEMORY.md`，按优先级排序。
3. 将能够归类的结论追加至 `prompts` 目录下相关文档；若没有该类文档则创建（文档名采用驼峰式命名），同时更新 `prompts/MEMORY.md` 内的指代部分，确保该类文档能被正常加载。

当你进行回复后，将你已经完成了的工作和已知的问题或错误，在概括后写进 `prompts/MEMORY.md` 的对应部分，确保你的下一位工作者能在较短时间内，使用较少的 token 便能详细了解当前情况。

## 作用域

### 禁止的操作

- 修改 .github/workflows/ 中的 CI 配置（除非任务明确要求）
- 修改 LICENSE、CODE_OF_CONDUCT.md（除非任务明确要求）
- 在代码中修改或新增密钥、Token 或敏感凭证（除非任务明确要求）
- 未经确认的大范围程序重构
- 修改 `.env*` 文件的值（允许修改或新增键）

## 用户偏好

- 全程使用中文进行回答，非必要（专业术语外）尽量不要使用英文
- 在用户没有要求的情况下，不要进行繁重的检查与测试，只检测是否有报错即可

## 编码规范

- **每次包含代码修改的对话结束后，必须执行 `npm run lint`** 以确保代码通过 ESLint 纠错和 Prettier 格式化。
- 不要在 `App.vue` 里写过多内容。
- 编写组件前，检查是否有类似组件可以重复使用。编写组件时，若组件无法被重复利用（仅在单页面使用），需在 `src/components/` 建立该页面的文件夹，方便归纳整洁；若能被重复使用，请放置在 `src/components/` 目录下。

## 提升效率

- 部分查询、API 尝试等不必占用主 Agent 需新建子代理（sub-agent）完成。
- 能并行处理、提升效率且能保证质量的操作，需要同时多开多个子代理快速完成。
