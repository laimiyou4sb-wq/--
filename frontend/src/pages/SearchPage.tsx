import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useInspirations, useSavedFilters, saveFilter, deleteFilter } from '@/hooks/useDb'
import { InspirationCard } from '@/components/inspiration/InspirationCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUIStore } from '@/stores/ui'
import {
  Search,
  X,
  Filter,
  Clock,
  Bookmark,
  Trash2,
} from 'lucide-react'
import type { InspirationStatus, InspirationType, SearchFilter } from '@/types'
import { STATUS_LABELS } from '@/lib/utils'
import { MAX_SEARCH_HISTORY, STORAGE_KEYS } from '@/lib/constants'

function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]')
  } catch {
    return []
  }
}
function addSearchHistory(query: string) {
  const history = getSearchHistory().filter((h) => h !== query)
  history.unshift(query)
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history.slice(0, MAX_SEARCH_HISTORY)))
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [status, setStatus] = useState<InspirationStatus | 'all'>('all')
  const [type, setType] = useState<InspirationType | 'all'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState(getSearchHistory)
  const [filterName, setFilterName] = useState('')

  const inspirations = useInspirations()
  const savedFilters = useSavedFilters()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)

  // Build inverted index
  const searchIndex = useMemo(() => {
    const index: Map<string, Set<string>> = new Map()
    for (const insp of inspirations) {
      const text = `${insp.title} ${insp.description || ''} ${insp.tags.join(' ')} ${insp.source || ''} ${insp.context || ''}`.toLowerCase()
      // Simple bigram tokenization for Chinese + word split for English
      const tokens: string[] = []
      // Chinese bigrams
      const chineseChars = text.match(/[一-鿿]/g) || []
      for (let i = 0; i < chineseChars.length - 1; i++) {
        tokens.push(chineseChars[i] + chineseChars[i + 1])
      }
      // English words
      const englishWords = text.match(/[a-z0-9]+/g) || []
      tokens.push(...englishWords)
      // Also add single Chinese chars
      tokens.push(...chineseChars)

      for (const token of tokens) {
        if (!index.has(token)) index.set(token, new Set())
        index.get(token)!.add(insp.id)
      }
    }
    return index
  }, [inspirations])

  const results = useMemo(() => {
    if (!query.trim() && status === 'all' && type === 'all' && selectedTags.length === 0) {
      return []
    }

    let matches: Set<string> | null = null

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      const qTokens: string[] = []
      const chineseChars = q.match(/[一-鿿]/g) || []
      for (let i = 0; i < chineseChars.length - 1; i++) {
        qTokens.push(chineseChars[i] + chineseChars[i + 1])
      }
      const englishWords = q.match(/[a-z0-9]+/g) || []
      qTokens.push(...englishWords)
      qTokens.push(...chineseChars)

      // TF-IDF lite: count how many tokens match for each inspiration
      const scores = new Map<string, number>()
      for (const token of qTokens) {
        const ids = searchIndex.get(token)
        if (ids) {
          for (const id of ids) {
            scores.set(id, (scores.get(id) || 0) + 1)
          }
        }
      }
      // Also check direct substring match
      for (const insp of inspirations) {
        const text = `${insp.title} ${insp.description || ''} ${insp.tags.join(' ')}`.toLowerCase()
        if (text.includes(q)) {
          scores.set(insp.id, (scores.get(insp.id) || 0) + 3)
        }
      }

      matches = new Set(scores.keys())
    } else {
      matches = new Set(inspirations.map((i) => i.id))
    }

    return inspirations.filter((i) => {
      if (matches && !matches.has(i.id)) return false
      if (status !== 'all' && i.status !== status) return false
      if (type !== 'all' && i.type !== type) return false
      if (selectedTags.length > 0 && !selectedTags.some((t) => i.tags.includes(t))) return false
      return true
    })
  }, [inspirations, query, status, type, selectedTags, searchIndex])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.trim()) {
      addSearchHistory(searchQuery.trim())
      setSearchHistory(getSearchHistory())
    }
  }

  const clearFilters = () => {
    setQuery('')
    setStatus('all')
    setType('all')
    setSelectedTags([])
  }

  const handleSaveFilter = async () => {
    if (!filterName.trim()) return
    await saveFilter(filterName.trim(), { query, status, tags: selectedTags, source: '', type })
    addToast('筛选条件已保存', 'success')
    setFilterName('')
  }

  const handleApplyFilter = (filter: SearchFilter) => {
    setQuery(filter.query || '')
    setStatus(filter.status || 'all')
    setType(filter.type || 'all')
    setSelectedTags(filter.tags || [])
  }

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    inspirations.forEach((i) => i.tags.forEach((t) => tags.add(t)))
    return [...tags].sort()
  }, [inspirations])

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">搜索</h1>
        <p className="text-sm text-muted-foreground mt-1">搜索 {inspirations.length} 条灵感</p>
      </div>

      {/* Search input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索灵感内容..."
            className="pl-9 h-9 text-sm"
            autoFocus
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1 text-xs h-9"
        >
          <Filter className="h-3.5 w-3.5" />
          筛选
        </Button>
        {(query || status !== 'all' || type !== 'all' || selectedTags.length > 0) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">状态</label>
                <Select value={status} onValueChange={(v) => setStatus(v as InspirationStatus | 'all')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="thinking">思考中</SelectItem>
                    <SelectItem value="developing">发展中</SelectItem>
                    <SelectItem value="applied">已应用</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">类型</label>
                <Select value={type} onValueChange={(v) => setType(v as InspirationType | 'all')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="seed">种子</SelectItem>
                    <SelectItem value="mature">成熟</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">标签</label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px] py-0 h-5"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="保存筛选名称..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="h-8 text-xs w-40"
              />
              <Button variant="outline" size="sm" onClick={handleSaveFilter} disabled={!filterName.trim()} className="text-xs h-8">
                <Bookmark className="h-3 w-3 mr-1" />
                保存
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search history */}
      {!query && results.length === 0 && searchHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              搜索历史
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {searchHistory.slice(0, 8).map((h, i) => (
              <div
                key={i}
                onClick={() => handleSearch(h)}
                className="flex items-center gap-2 p-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-accent transition-all duration-200"
              >
                <Clock className="h-3 w-3" />
                {h}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Saved filters */}
      {savedFilters.length > 0 && !query && results.length === 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              保存的筛选
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {savedFilters.map((sf) => (
              <div key={sf.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors">
                <span
                  className="text-sm flex-1 cursor-pointer"
                  onClick={() => handleApplyFilter(sf.filter)}
                >
                  {sf.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={async () => {
                    await deleteFilter(sf.id)
                    addToast('筛选条件已删除', 'success')
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">{results.length} 条结果</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((insp) => (
              <InspirationCard key={insp.id} inspiration={insp} />
            ))}
          </div>
        </div>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">未找到匹配的灵感</p>
        </div>
      )}
    </div>
  )
}
