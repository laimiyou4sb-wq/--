# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (run from frontend/)
cd frontend
npm run dev       # Vite dev server (localhost:5173)
npm run build     # tsc -b && vite build → dist/
npm run preview   # Preview production build
npm run test      # vitest run (jsdom + @testing-library/jest-dom)
npm run test:watch # vitest watch mode

# Tauri desktop app (v2)
npm run tauri:dev  # Vite + Tauri dev
npm run tauri:build # tsc -b && vite build, then tauri build → src-tauri/target/release/
```

## Architecture

**灵感知识库** — Local-First React SPA. All data lives in IndexedDB via Dexie.js; the app works fully offline. The AI features (Discovery page) are optional enhancements requiring a user-configured OpenAI-compatible API.

### Data flow split

- **Domain data** (inspirations, boards, diaries, filters, settings) — IndexedDB via Dexie, accessed through `useLiveQuery` hooks in `src/hooks/useDb.ts`. No React Context or Zustand for server data.
- **UI state** (theme, sidebar, command palette, toasts, search) — Zustand store in `src/stores/ui.ts`

### 层级关系

看板功能 > 看板 > 灵感：一个看板功能下可创建多个看板，每个看板包含多张灵感卡片。灵感通过状态（developing/thinking/applied/archived）分布在看板的固定四列中。

### Key patterns

- **Reactive queries**: Every `useDb` hook uses `useLiveQuery()` from dexie-react-hooks — any IndexedDB write automatically re-renders subscribed components.
- **Inspiration connections**: Bidirectional. `connections[]` stored on the source inspiration. `addConnection()` prevents duplicates; `deleteInspiration()` cleans up reverse references from other inspirations.
- **Connection relation types**: `related`, `inspired`, `derived`, `contradicts`, `supports`.
- **Search**: Client-side TF-IDF in `SearchPage.tsx`. Chinese tokenized via bigrams, English via word split. Substring match bonus on top of token overlap scoring.
- **AI integration**: `src/lib/api.ts` exports `chatCompletion()` — calls OpenAI-compatible Chat Completions API. Settings page lets users configure endpoint/presets (OpenAI, DeepSeek, OpenRouter, Ollama).
- **Seed data**: `initSeedData()` runs on mount, checks `db.inspirations.count()`, bulk-inserts sample data if empty. Seed data is in `src/data/seed.ts` — edit that file to customize default content.
- **Theme**: Tailwind `darkMode: 'class'`. `App.tsx` toggles `.dark` on `<html>` based on `useUIStore.theme`, subscribes to `prefers-color-scheme` when set to `"system"`.
- **Keyboard shortcuts**: Cmd/Ctrl+K (CommandPalette), Cmd/Ctrl+N (QuickCapture). Handled in `AppShell` via `useKeyboardShortcut`.
- **Kanban DnD**: `@dnd-kit/core` + `@dnd-kit/sortable` in `BoardDetailPage.tsx`, `closestCorners` collision. Column state persisted via `saveBoard()`.

### Routing (App.tsx → createHashRouter)

All pages are `React.lazy()` loaded under `AppShell` layout (`<Outlet />`):

`/` (dashboard), `/browse`, `/capture` / `/capture/:id`, `/inspiration/:id`, `/discovery`, `/boards` / `/boards/:id`, `/diary`, `/search`, `/settings`

### Database schema (Dexie, db.ts)

| Table | Key indexes | Notable fields |
|-------|-------------|----------------|
| inspirations | status, type, createdAt, updatedAt, lastViewedAt, viewCount, isPinned, *tags | connections[{targetId, relation, note}], links[], resources[], actionItems[{text, completed}] |
| boards | createdAt, updatedAt | columns[{title, inspirationIds[]}] |
| diaryEntries | date, createdAt | mood (excited/happy/neutral/tired/anxious), linkedInspirationIds[] |
| savedFilters | createdAt | filter (SearchFilter) |
| settings | id='app' | apiBaseUrl, apiKey, apiModel (for AI features) |

### shadcn/ui components

All in `src/components/ui/`. Use `React.forwardRef`, accept `className` merged via `cn()` (clsx + tailwind-merge). The `Command` component is custom (not cmdk) — uses Radix Dialog + internal React Context for keyboard navigation.

### Test infrastructure

Vitest with jsdom environment, `globals: true`. Setup file `src/test/setup.ts` loads `@testing-library/jest-dom/vitest` matchers. Test location: `src/test/`. Run a single test file with `npx vitest run path/to/test.test.ts`.

### Path alias

`@/` → `src/` (configured in vite.config.ts, vitest.config.ts, and tsconfig.json)
