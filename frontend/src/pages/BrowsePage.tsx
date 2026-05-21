import { useState, useMemo } from 'react'
import { useInspirations } from '@/hooks/useDb'
import { InspirationCard } from '@/components/inspiration/InspirationCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X, Grid3X3, List } from 'lucide-react'
import type { InspirationType, InspirationStatus } from '@/types'
import { STATUS_LABELS, TYPE_LABELS } from '@/lib/utils'

export default function BrowsePage() {
  const inspirations = useInspirations()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<InspirationType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<InspirationStatus | 'all'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    inspirations.forEach((i) => i.tags.forEach((t) => tagSet.add(t)))
    return [...tagSet].sort()
  }, [inspirations])

  const filtered = useMemo(() => {
    return inspirations.filter((i) => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !(i.description || '').toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (typeFilter !== 'all' && i.type !== typeFilter) return false
      if (statusFilter !== 'all' && i.status !== statusFilter) return false
      if (selectedTags.length > 0 && !selectedTags.some((t) => i.tags.includes(t))) return false
      return true
    })
  }, [inspirations, search, typeFilter, statusFilter, selectedTags])

  const timeGroups = useMemo(() => {
    const groups: Record<string, typeof inspirations> = {}
    filtered.forEach((i) => {
      const date = i.createdAt.split('T')[0]
      if (!groups[date]) groups[date] = []
      groups[date].push(i)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setStatusFilter('all')
    setSelectedTags([])
  }

  const hasFilters = search || typeFilter !== 'all' || statusFilter !== 'all' || selectedTags.length > 0

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">灵感库</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} 条灵感</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索灵感..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as InspirationType | 'all')}>
            <SelectTrigger className="h-8 w-[90px] text-xs">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="seed">种子</SelectItem>
              <SelectItem value="mature">成熟</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InspirationStatus | 'all')}>
            <SelectTrigger className="h-8 w-[90px] text-xs">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="thinking">思考中</SelectItem>
              <SelectItem value="developing">发展中</SelectItem>
              <SelectItem value="applied">已应用</SelectItem>
              <SelectItem value="archived">已归档</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-lg">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('grid')}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('list')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
              <X className="h-3 w-3" />
              清除
            </Button>
          )}
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.slice(0, 15).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] py-0 h-5 transition-colors"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
            {allTags.length > 15 && (
              <span className="text-xs text-muted-foreground self-center">+{allTags.length - 15} 更多</span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <Tabs defaultValue="timeline">
        <TabsList className="h-8">
          <TabsTrigger value="timeline" className="text-xs h-7">时间线</TabsTrigger>
          <TabsTrigger value="status" className="text-xs h-7">按状态</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">没有找到匹配的灵感</p>
              {hasFilters && (
                <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">
                  清除筛选条件
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {timeGroups.map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-xs font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                    {date}
                  </h3>
                  <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
                    {items.map((insp) => (
                      <InspirationCard key={insp.id} inspiration={insp} compact={view === 'list'} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="status" className="mt-4">
          <div className="space-y-6">
            {(['thinking', 'developing', 'applied', 'archived'] as const).map((status) => {
              const items = filtered.filter((i) => i.status === status)
              if (items.length === 0) return null
              return (
                <div key={status}>
                  <h3 className="text-xs font-medium text-muted-foreground mb-3">
                    {STATUS_LABELS[status]} ({items.length})
                  </h3>
                  <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
                    {items.map((insp) => (
                      <InspirationCard key={insp.id} inspiration={insp} compact={view === 'list'} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
