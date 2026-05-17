import Dexie, { type Table } from 'dexie'
import type { Inspiration, Board, DiaryEntry, SavedFilter, AppSettings } from '@/types'

export class InspirationDB extends Dexie {
  inspirations!: Table<Inspiration, string>
  boards!: Table<Board, string>
  diaryEntries!: Table<DiaryEntry, string>
  savedFilters!: Table<SavedFilter, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super('InspirationKB')

    this.version(1).stores({
      inspirations:
        'id, status, type, createdAt, updatedAt, lastViewedAt, viewCount, isPinned, *tags',
      boards: 'id, createdAt, updatedAt',
      diaryEntries: 'id, date, createdAt',
      savedFilters: 'id, createdAt',
      settings: 'id',
    })
  }
}

export const db = new InspirationDB()
