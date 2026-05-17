import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const date = new Date(dateStr)
  if (format === 'relative') {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 7) return `${days} 天前`
    if (days < 30) return `${Math.floor(days / 7)} 周前`
    if (days < 365) return `${Math.floor(days / 30)} 个月前`
    return `${Math.floor(days / 365)} 年前`
  }
  if (format === 'long') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export const STATUS_LABELS: Record<string, string> = {
  thinking: '思考中',
  developing: '发展',
  applied: '已应用',
  archived: '归档',
}

export const STATUS_COLORS: Record<string, string> = {
  thinking: 'text-amber-500 bg-amber-500/10',
  developing: 'text-blue-500 bg-blue-500/10',
  applied: 'text-emerald-500 bg-emerald-500/10',
  archived: 'text-slate-400 bg-slate-400/10',
}

export const TYPE_LABELS: Record<string, string> = {
  seed: '种子',
  mature: '成熟',
}

export const RELATION_LABELS: Record<string, string> = {
  related: '相关',
  inspired: '启发',
  derived: '派生',
  contradicts: '矛盾',
  supports: '支撑',
}

export const MOOD_LABELS: Record<string, { label: string; emoji: string }> = {
  excited: { label: '兴奋', emoji: '🤩' },
  happy: { label: '开心', emoji: '😊' },
  neutral: { label: '平静', emoji: '😐' },
  tired: { label: '疲惫', emoji: '😴' },
  anxious: { label: '焦虑', emoji: '😰' },
}
