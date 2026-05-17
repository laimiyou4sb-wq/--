# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server on localhost:5173
npm run build    # TypeScript check + Vite production build → dist/
npm run preview  # Preview production build locally
```

## Project overview

灵感知识库 (Inspiration Knowledge Base) — a purely client-side React SPA for capturing, connecting, and discovering creative inspirations. No backend; all data lives in IndexedDB via Dexie.js.

## Architecture

**Data flow**: Components → hooks (`useDb.ts`) → Dexie CRUD → IndexedDB. Dexie's `useLiveQuery()` provides reactive re-renders on data changes. There is no React Context for data — each hook reads directly from Dexie.

**State split**:
- **Server state** (inspirations, boards, diaries, filters) — IndexedDB via Dexie, accessed through hooks in `src/hooks/useDb.ts`
- **UI state** (theme, sidebar, command palette, toasts) — Zustand store in `src/stores/ui.ts`

**Theme**: Tailwind `class` strategy. `App.tsx` owns the theme effect — it reads `useUIStore.theme` and toggles `.dark` on `<html>`, also subscribing to `prefers-color-scheme` media queries when theme is `"system"`.

**Routing**: `createBrowserRouter` with `AppShell` as the layout route wrapping all pages. All pages are `React.lazy()` loaded for code splitting. Paths defined in `src/App.tsx`.

**Keyboard shortcuts**: `useKeyboardShortcut` hook in `src/hooks/useKeyboardShortcut.ts`. Cmd/Ctrl+K opens the CommandPalette, Cmd/Ctrl+N opens QuickCapture. Both listen on `window` keydown.

**Seed data**: `src/data/seed.ts` contains 22 sample inspirations + 2 boards + 3 diary entries. `initSeedData()` in `useDb.ts` checks `db.inspirations.count()` on first load and bulk-inserts if empty.

**Search**: Client-side inverted index + TF-IDF lite in `SearchPage.tsx`. Tokenizes Chinese via bigrams + English via word split. Builds a `Map<token, Set<inspirationId>>` and scores matches by token overlap with substring bonus.

**Kanban drag-and-drop**: `@dnd-kit/core` + `@dnd-kit/sortable` in `BoardDetailPage.tsx`. Uses `closestCorners` collision detection. Cards are sortable within columns and movable across columns. Board column state is persisted via `saveBoard()`.

**Inspiration connections**: Bidirectional linking model stored as `connections[]` on the source Inspiration (typed as `InspirationConnection` with `targetId` + `relation`). `addConnection()` avoids duplicates. `deleteInspiration()` cleans up connections pointing to the deleted inspiration from other inspirations.

## Key files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript interfaces and type aliases |
| `src/lib/db.ts` | Dexie schema (v1, 5 tables) |
| `src/lib/utils.ts` | `cn()`, `formatDate()`, `generateId()`, status/tag label maps |
| `src/lib/constants.ts` | Default tags, storage keys, thresholds |
| `src/hooks/useDb.ts` | All CRUD operations + `useLiveQuery` hooks + seed init |
| `src/stores/ui.ts` | Zustand store for theme, sidebar, command palette, toasts, search query |
| `src/App.tsx` | Router definition, theme effect, global keyboard shortcuts |
| `src/components/ui/` | shadcn-style Radix UI primitives (Button, Dialog, Select, etc.) |
| `src/components/layout/` | AppShell, Sidebar, TopBar, MobileNav |
| `src/components/inspiration/` | CommandPalette, QuickCapture, InspirationCard, TagSelect |
| `src/data/seed.ts` | 22 sample inspirations with cross-connections |

## UI component patterns

- All UI components use `React.forwardRef` and accept `className` merged via `cn()`
- `src/components/ui/command.tsx` is a custom command palette (not cmdk) using Radix Dialog + internal React Context for keyboard navigation
- `TagSelect` maintains its own input state and shows filtered suggestions from `DEFAULT_TAGS`
- `InspirationCard` is a `<Link>` wrapping a `<Card>`, navigates to detail page on click

## Database schema (IndexedDB via Dexie v1)

Tables: `inspirations` (keyed by `id`), `boards`, `diaryEntries`, `savedFilters`, `settings`.
The `inspirations` table has indexes on `status`, `type`, `createdAt`, `updatedAt`, `lastViewedAt`, `viewCount`, `isPinned`, and a multi-entry index on `*tags`.
