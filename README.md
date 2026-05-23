# 灵感知识库

Local-First 知识管理桌面应用。灵感捕捉、看板整理、AI 启发，所有数据存储在本地 IndexedDB，无需网络即可使用。

## 功能

- **灵感捕捉** — 快速记录想法，支持标签、链接、资源附件
- **看板管理** — 拖拽式看板组织灵感卡片，自定义列状态
- **灵感连接** — 双向关联灵感（相关/启发/衍生/矛盾/支持）
- **AI 启发** — 接入大模型 API 自动发现灵感间的新连接（可选功能）
- **日记** — 关联灵感记录每日反思
- **全文搜索** — 客户端 TF-IDF 搜索，中英文分词
- **PDF 导出** — 灵感内容导出为 PDF
- **离线优先** — 基于 IndexedDB，完全离线可用

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 桌面端 | Tauri v2 |
| UI | Tailwind CSS + shadcn/ui (Radix UI) |
| 数据 | Dexie.js (IndexedDB) |
| 状态 | Zustand |
| 路由 | React Router v6 |
| AI | OpenAI 兼容 API（支持 OpenAI / DeepSeek / OpenRouter / Ollama） |

## 快速开始

```bash
cd frontend

# 浏览器开发
npm install
npm run dev        # localhost:5173

# Tauri 桌面开发（需安装 Rust）
npm run tauri:dev

# 生产构建
npm run tauri:build

# 运行测试
npm run test
```

## 项目结构

```
frontend/
  src/
    components/    # UI 组件
    hooks/         # useDb (Dexie 实时查询), useKeyboardShortcut
    lib/           # API 调用, 工具函数
    pages/         # 路由页面 (Home, Browse, Capture, Discovery, Boards, Diary, Search, Settings)
    stores/        # Zustand UI 状态 (主题, 侧边栏, 命令面板等)
    data/          # 数据库 schema (Dexie) 和种子数据
  src-tauri/       # Tauri Rust 后端
  electron/        # Electron 后端 (已弃用, 迁移至 Tauri)

backend/           # Express API 骨架 (预留)
```

## 协议

MIT License
