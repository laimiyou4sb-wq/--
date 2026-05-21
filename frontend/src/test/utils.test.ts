import { describe, it, expect } from 'vitest'
import { cn, formatDate, generateId, truncate, STATUS_LABELS, STATUS_COLORS, TYPE_LABELS, RELATION_LABELS, MOOD_LABELS } from '@/lib/utils'

describe('cn', () => {
  it('合并类名', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('过滤 falsy 值', () => {
    expect(cn('text-sm', false && 'hidden', undefined, null, '')).toBe('text-sm')
  })

  it('tailwind 冲突合并', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })
})

describe('formatDate', () => {
  it('short 格式: YYYY/MM/DD', () => {
    const result = formatDate('2025-03-15T08:00:00Z', 'short')
    expect(result).toMatch(/2025/)
  })

  it('long 格式: 中文完整日期', () => {
    const result = formatDate('2025-03-15T08:00:00Z', 'long')
    expect(result).toContain('2025')
    expect(result).toContain('3')
  })

  it('relative: 刚刚', () => {
    const now = new Date()
    now.setSeconds(now.getSeconds() - 30)
    expect(formatDate(now.toISOString(), 'relative')).toBe('刚刚')
  })

  it('relative: 分钟前', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatDate(d.toISOString(), 'relative')).toBe('5 分钟前')
  })

  it('relative: 小时前', () => {
    const d = new Date(Date.now() - 3 * 3600 * 1000)
    expect(formatDate(d.toISOString(), 'relative')).toBe('3 小时前')
  })

  it('relative: 天前', () => {
    const d = new Date(Date.now() - 3 * 86400 * 1000)
    expect(formatDate(d.toISOString(), 'relative')).toBe('3 天前')
  })

  it('relative: 周前', () => {
    const d = new Date(Date.now() - 14 * 86400 * 1000)
    expect(formatDate(d.toISOString(), 'relative')).toBe('2 周前')
  })

  it('relative: 月前', () => {
    const d = new Date(Date.now() - 60 * 86400 * 1000)
    expect(formatDate(d.toISOString(), 'relative')).toBe('2 个月前')
  })

  it('relative: 年前', () => {
    const d = new Date(Date.now() - 400 * 86400 * 1000)
    expect(formatDate(d.toISOString(), 'relative')).toBe('1 年前')
  })
})

describe('generateId', () => {
  it('生成唯一 ID 字符串', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('每次生成不同值', () => {
    const ids = Array.from({ length: 10 }, () => generateId())
    const unique = new Set(ids)
    expect(unique.size).toBe(10)
  })
})

describe('truncate', () => {
  it('短文本直接返回', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('超长文本截断并加省略号', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('恰好等长直接返回', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('空字符串', () => {
    expect(truncate('', 5)).toBe('')
  })
})

describe('常量映射', () => {
  it('STATUS_LABELS 包含所有状态', () => {
    expect(STATUS_LABELS).toHaveProperty('thinking', '思考中')
    expect(STATUS_LABELS).toHaveProperty('developing', '发展')
    expect(STATUS_LABELS).toHaveProperty('applied', '已应用')
    expect(STATUS_LABELS).toHaveProperty('archived', '归档')
  })

  it('STATUS_COLORS 包含所有状态', () => {
    expect(STATUS_COLORS.thinking).toContain('amber')
    expect(STATUS_COLORS.developing).toContain('blue')
    expect(STATUS_COLORS.applied).toContain('emerald')
    expect(STATUS_COLORS.archived).toContain('slate')
  })

  it('TYPE_LABELS', () => {
    expect(TYPE_LABELS).toHaveProperty('seed', '种子')
    expect(TYPE_LABELS).toHaveProperty('mature', '成熟')
  })

  it('RELATION_LABELS 包含所有关系类型', () => {
    expect(RELATION_LABELS).toHaveProperty('related', '相关')
    expect(RELATION_LABELS).toHaveProperty('inspired', '启发')
    expect(RELATION_LABELS).toHaveProperty('derived', '派生')
    expect(RELATION_LABELS).toHaveProperty('contradicts', '矛盾')
    expect(RELATION_LABELS).toHaveProperty('supports', '支撑')
  })

  it('MOOD_LABELS 包含所有心情', () => {
    expect(MOOD_LABELS.excited.label).toBe('兴奋')
    expect(MOOD_LABELS.happy.label).toBe('开心')
    expect(MOOD_LABELS.neutral.label).toBe('平静')
    expect(MOOD_LABELS.tired.label).toBe('疲惫')
    expect(MOOD_LABELS.anxious.label).toBe('焦虑')
  })
})
