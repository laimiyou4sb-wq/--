import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Inspiration, Board, DiaryEntry, SavedFilter, AppSettings } from '@/types'
import { generateId } from '@/lib/utils'
import { seedInspirations, seedBoards, seedDiaryEntries } from '@/data/seed'

// Inspiration CRUD
export function useInspirations() {
  return useLiveQuery(() => db.inspirations.orderBy('updatedAt').reverse().toArray()) || []
}

export function useInspiration(id: string | undefined) {
  return useLiveQuery(() => (id ? db.inspirations.get(id) : undefined), [id])
}

export async function saveInspiration(
  data: Partial<Inspiration> & { title: string }
): Promise<Inspiration> {
  try {
    const now = new Date().toISOString()
    const inspiration: Inspiration = {
      id: data.id || generateId(),
      title: data.title,
      type: data.type || 'seed',
      status: data.status || 'thinking',
      description: data.description,
      source: data.source,
      context: data.context,
      tags: data.tags || [],
      links: data.links || [],
      resources: data.resources || [],
      actionItems: data.actionItems || [],
      connections: data.connections || [],
      createdAt: data.createdAt || now,
      updatedAt: now,
      lastViewedAt: data.lastViewedAt,
      viewCount: data.viewCount || 0,
      isPinned: data.isPinned || false,
    }
    await db.inspirations.put(inspiration)
    return inspiration
  } catch (e) {
    throw new Error(`保存灵感失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

export async function deleteInspiration(id: string): Promise<void> {
  try {
    // Remove connections from other inspirations
    const all = await db.inspirations.toArray()
    for (const insp of all) {
      const filtered = insp.connections.filter((c) => c.targetId !== id)
      if (filtered.length !== insp.connections.length) {
        await db.inspirations.update(insp.id, { connections: filtered, updatedAt: new Date().toISOString() })
      }
    }
    // Remove from board columns
    const boards = await db.boards.toArray()
    for (const board of boards) {
      const updatedColumns = board.columns.map((col) => ({
        ...col,
        inspirationIds: col.inspirationIds.filter((iid) => iid !== id),
      }))
      if (updatedColumns.some((col, i) => col.inspirationIds.length !== board.columns[i].inspirationIds.length)) {
        await db.boards.update(board.id, { columns: updatedColumns, updatedAt: new Date().toISOString() })
      }
    }
    // Remove from diary entries
    const diaries = await db.diaryEntries.toArray()
    for (const entry of diaries) {
      if (entry.linkedInspirationIds.includes(id)) {
        await db.diaryEntries.update(entry.id, {
          linkedInspirationIds: entry.linkedInspirationIds.filter((iid) => iid !== id),
          updatedAt: new Date().toISOString(),
        })
      }
    }
    await db.inspirations.delete(id)
  } catch (e) {
    throw new Error(`删除灵感失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

const lastViewedMap = new Map<string, number>()

export async function viewInspiration(id: string): Promise<void> {
  try {
    const now = Date.now()
    const lastView = lastViewedMap.get(id) || 0
    if (now - lastView < 5000) return

    const insp = await db.inspirations.get(id)
    if (insp) {
      await db.inspirations.update(id, {
        viewCount: (insp.viewCount || 0) + 1,
        lastViewedAt: new Date().toISOString(),
      })
      lastViewedMap.set(id, now)
    }
  } catch (e) {
    // View count failure is non-critical, log and swallow
    console.error('更新查看计数失败:', e)
  }
}

export async function addConnection(
  sourceId: string,
  targetId: string,
  relation: Inspiration['connections'][0]['relation'],
  note?: string
): Promise<void> {
  try {
    const insp = await db.inspirations.get(sourceId)
    if (!insp) return
    const newConn = {
      id: generateId(),
      targetId,
      relation,
      note,
      createdAt: new Date().toISOString(),
    }
    if (insp.connections.some((c) => c.targetId === targetId)) return
    await db.inspirations.update(sourceId, {
      connections: [...insp.connections, newConn],
      updatedAt: new Date().toISOString(),
    })
  } catch (e) {
    throw new Error(`添加关联失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

// Board CRUD
export function useBoards() {
  return useLiveQuery(() => db.boards.orderBy('updatedAt').reverse().toArray()) || []
}

export function useBoard(id: string | undefined) {
  return useLiveQuery(() => (id ? db.boards.get(id) : undefined), [id])
}

export async function saveBoard(data: Partial<Board> & { title: string }): Promise<Board> {
  try {
    const now = new Date().toISOString()
    const board: Board = {
      id: data.id || generateId(),
      title: data.title,
      description: data.description,
      columns: data.columns || [
        { id: generateId(), title: '收集', inspirationIds: [] },
        { id: generateId(), title: '筛选中', inspirationIds: [] },
        { id: generateId(), title: '执行中', inspirationIds: [] },
        { id: generateId(), title: '已完成', inspirationIds: [] },
      ],
      createdAt: data.createdAt || now,
      updatedAt: now,
    }
    await db.boards.put(board)
    return board
  } catch (e) {
    throw new Error(`保存看板失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

export async function deleteBoard(id: string): Promise<void> {
  try {
    await db.boards.delete(id)
  } catch (e) {
    throw new Error(`删除看板失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

// Diary CRUD
export function useDiaryEntries() {
  return useLiveQuery(() => db.diaryEntries.orderBy('date').reverse().toArray()) || []
}

export function useDiaryEntry(date: string | undefined) {
  return useLiveQuery(() => (date ? db.diaryEntries.where('date').equals(date).first() : undefined), [date])
}

export async function saveDiaryEntry(
  data: Partial<DiaryEntry> & { date: string; content: string }
): Promise<DiaryEntry> {
  try {
    const now = new Date().toISOString()
    const existing = await db.diaryEntries.where('date').equals(data.date).first()
    const entry: DiaryEntry = {
      id: existing?.id || generateId(),
      date: data.date,
      content: data.content,
      mood: data.mood,
      linkedInspirationIds: data.linkedInspirationIds || [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }
    await db.diaryEntries.put(entry)
    return entry
  } catch (e) {
    throw new Error(`保存日记失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

// Settings
export function useSettings() {
  return useLiveQuery(async () => {
    const settings = await db.settings.get('app')
    return settings || { theme: 'system' as const, sidebarCollapsed: false, dailyNotificationEnabled: false, dailyNotificationTime: '08:00', autoBackupEnabled: true, apiBaseUrl: 'https://api.openai.com/v1', apiKey: '', apiModel: 'gpt-4o-mini' }
  })
}

export async function saveSettings(data: Partial<AppSettings>): Promise<void> {
  try {
    const existing = await db.settings.get('app')
    const defaults: AppSettings = {
      theme: 'system',
      sidebarCollapsed: false,
      dailyNotificationEnabled: false,
      dailyNotificationTime: '08:00',
      autoBackupEnabled: true,
      apiBaseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      apiModel: 'gpt-4o-mini',
    }
    const settings = { ...defaults, ...existing, ...data, id: 'app' }
    await db.settings.put(settings)
  } catch (e) {
    throw new Error(`保存设置失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

// Seed data initialization
export async function initSeedData(): Promise<void> {
  const count = await db.inspirations.count()
  if (count === 0) {
    await db.inspirations.bulkPut(seedInspirations)
    await db.boards.bulkPut(seedBoards)
    await db.diaryEntries.bulkPut(seedDiaryEntries)
  }
}

// Saved filters
export function useSavedFilters() {
  return useLiveQuery(() => db.savedFilters.orderBy('createdAt').reverse().toArray()) || []
}

export async function saveFilter(name: string, filter: any): Promise<void> {
  try {
    await db.savedFilters.put({
      id: generateId(),
      name,
      filter,
      createdAt: new Date().toISOString(),
    })
  } catch (e) {
    throw new Error(`保存过滤器失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

export async function deleteFilter(id: string): Promise<void> {
  try {
    await db.savedFilters.delete(id)
  } catch (e) {
    throw new Error(`删除过滤器失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
