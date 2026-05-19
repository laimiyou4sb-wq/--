# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

```
灵感/                  # Git root
├── frontend/          # React SPA
│   └── src/
│       ├── types/     # All TypeScript interfaces
│       ├── lib/       # db.ts (Dexie schema), utils.ts, constants.ts
│       ├── hooks/     # useDb.ts (CRUD + live queries), useKeyboardShortcut.ts
│       ├── stores/    # ui.ts (Zustand: theme, sidebar, toasts, search)
│       ├── components/ui/           # shadcn-style Radix primitives
│       ├── components/layout/       # AppShell, Sidebar, TopBar, MobileNav
│       ├── components/inspiration/  # CommandPalette, QuickCapture, InspirationCard, TagSelect
│       ├── pages/     # Route-level page components (lazy-loaded)
│       └── data/      # seed.ts (22 sample inspirations + boards + diary entries)
├── backend/           # Express + TypeScript API
│   └── src/
│       ├── index.ts   # Entry point
│       ├── routes/    # API routes
│       └── middleware/ # Express middleware
└── docs/              # Project requirements and documentation
```

## Commands

All commands run from the `frontend/` directory:

```bash
cd frontend
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # TypeScript check + Vite production build → dist/
npm run preview   # Preview production build locally
```

```bash
cd backend
npm run dev       # Start Express dev server (localhost:3001) with hot reload
npm run build     # TypeScript compile → dist/
npm start         # Run production build
```

No test runner or lint setup yet in either project.

## Architecture

**灵感知识库 (Inspiration Knowledge Base)** — a purely client-side React SPA. No backend; all data lives in IndexedDB via Dexie.js. Single-page app with lazy-loaded routes via `createBrowserRouter`.

**Data flow**: Components → `useDb.ts` hooks → Dexie CRUD → IndexedDB. `useLiveQuery()` from dexie-react-hooks provides reactive re-renders — no React Context or manual state management for server data.

**State split**:
- **Domain data** (inspirations, boards, diaries, filters) — IndexedDB via Dexie, accessed through hooks in `src/hooks/useDb.ts`. Each hook uses `useLiveQuery`.
- **UI state** (theme, sidebar, command palette, toasts, search query) — Zustand store in `src/stores/ui.ts`

**Theme**: Tailwind `darkMode: 'class'` strategy. `App.tsx` owns the theme effect — reads `useUIStore.theme`, toggles `.dark` on `<html>`, and subscribes to `prefers-color-scheme` when theme is `"system"`.

**Routing**: `AppShell` is the layout route wrapping all pages via `<Outlet />`. All page components are `React.lazy()` loaded. On first load, `initSeedData()` checks if IndexedDB is empty and bulk-inserts seed data.

**Keyboard shortcuts**: Cmd/Ctrl+K opens CommandPalette, Cmd/Ctrl+N opens QuickCapture. Handled in `AppShell` via `useKeyboardShortcut` hook (listens on `window` keydown).

## Key design patterns

- **shadcn/ui components**: All in `src/components/ui/`, use `React.forwardRef`, accept `className` merged via `cn()` (clsx + tailwind-merge). The `Command` component is custom (not cmdk), using Radix Dialog + internal React Context for keyboard navigation.
- **Inspiration connections**: Bidirectional linking — `connections[]` stored on the source Inspiration. `addConnection()` avoids duplicates. `deleteInspiration()` cleans up reverse connections from other inspirations.
- **Search**: Client-side TF-IDF lite in `SearchPage.tsx`. Chinese tokenized via bigrams, English via word split. Scores by token overlap with substring bonus.
- **Kanban DnD**: `@dnd-kit/core` + `@dnd-kit/sortable` in `BoardDetailPage.tsx`, `closestCorners` collision detection. Board column state persisted via `saveBoard()`.
- **Seed data**: `initSeedData()` in `useDb.ts` runs on app mount, checks `db.inspirations.count()`, inserts if zero.

## Database schema (Dexie v1)

Tables: `inspirations` (indexes on status, type, createdAt, updatedAt, lastViewedAt, viewCount, isPinned, *tags), `boards`, `diaryEntries`, `savedFilters`, `settings` (keyed by `'app'`).

## User preferences

- 永远用中文交流
- 代码改动尽量小，不重构没坏的东西
- 不添加 emoji 作为 UI 装饰（心情选择器等用户表达功能除外）
- 改完代码直接展示效果，不解释底层原理
