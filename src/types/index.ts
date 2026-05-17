export type InspirationType = 'seed' | 'mature'
export type InspirationStatus = 'thinking' | 'developing' | 'applied' | 'archived'
export type Mood = 'excited' | 'happy' | 'neutral' | 'tired' | 'anxious'

export interface ActionItem {
  id: string
  text: string
  completed: boolean
}

export interface InspirationLink {
  url: string
  title?: string
  description?: string
}

export interface InspirationResource {
  id: string
  type: 'image' | 'file' | 'note'
  name: string
  url?: string
  data?: string // base64 for images
  createdAt: string
}

export interface InspirationConnection {
  id: string
  targetId: string
  relation: 'related' | 'inspired' | 'derived' | 'contradicts' | 'supports'
  note?: string
  createdAt: string
}

export interface Inspiration {
  id: string
  title: string
  type: InspirationType
  status: InspirationStatus
  description?: string
  source?: string
  context?: string
  tags: string[]
  links: InspirationLink[]
  resources: InspirationResource[]
  actionItems: ActionItem[]
  connections: InspirationConnection[]
  createdAt: string
  updatedAt: string
  lastViewedAt?: string
  viewCount: number
  isPinned: boolean
}

export interface BoardColumn {
  id: string
  title: string
  inspirationIds: string[]
}

export interface Board {
  id: string
  title: string
  description?: string
  columns: BoardColumn[]
  createdAt: string
  updatedAt: string
}

export interface DiaryEntry {
  id: string
  date: string // YYYY-MM-DD
  content: string
  mood?: Mood
  linkedInspirationIds: string[]
  createdAt: string
  updatedAt: string
}

export interface SearchFilter {
  query: string
  status?: InspirationStatus | 'all'
  tags: string[]
  source?: string
  type?: InspirationType | 'all'
  dateFrom?: string
  dateTo?: string
}

export interface SavedFilter {
  id: string
  name: string
  filter: SearchFilter
  createdAt: string
}

export interface AppSettings {
  id?: string
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  dailyNotificationEnabled: boolean
  dailyNotificationTime: string
  autoBackupEnabled: boolean
  lastBackupDate?: string
}
