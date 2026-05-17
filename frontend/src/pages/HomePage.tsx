import { useInspirations } from '@/hooks/useDb'
import { InspirationCard } from '@/components/inspiration/InspirationCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import {
  Lightbulb,
  Brain,
  Kanban,
  BookOpen,
  TrendingUp,
  Clock,
  Zap,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { formatDate, STATUS_LABELS } from '@/lib/utils'
import { useUIStore } from '@/stores/ui'

export default function HomePage() {
  const inspirations = useInspirations()
  const navigate = useNavigate()
  const setQuickCaptureOpen = useUIStore((s) => s.setQuickCaptureOpen)

  const pinned = inspirations.filter((i) => i.isPinned)
  const recent = inspirations.slice(0, 5)
  const recentlyViewed = [...inspirations]
    .filter((i) => i.lastViewedAt)
    .sort((a, b) => (b.lastViewedAt || '').localeCompare(a.lastViewedAt || ''))
    .slice(0, 3)

  const stats = {
    total: inspirations.length,
    seeds: inspirations.filter((i) => i.type === 'seed').length,
    mature: inspirations.filter((i) => i.type === 'mature').length,
    applied: inspirations.filter((i) => i.status === 'applied').length,
    connections: inspirations.reduce((sum, i) => sum + i.connections.length, 0),
  }

  const dailyInspirations = [...inspirations]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">仪表盘</h1>
          <p className="text-sm text-muted-foreground mt-1">
            今天又有 {inspirations.length} 个灵感等你探索
          </p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setQuickCaptureOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          捕捉灵感
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">总灵感</span>
          </div>
          <p className="text-2xl font-semibold mt-1">{stats.total}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">种子</span>
          </div>
          <p className="text-2xl font-semibold mt-1">{stats.seeds}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" />
            <span className="text-xs text-muted-foreground">成熟</span>
          </div>
          <p className="text-2xl font-semibold mt-1">{stats.mature}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">已应用</span>
          </div>
          <p className="text-2xl font-semibold mt-1">{stats.applied}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-xs text-muted-foreground">关联</span>
          </div>
          <p className="text-2xl font-semibold mt-1">{stats.connections}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily inspirations */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">今日灵感推荐</CardTitle>
              <span className="text-xs text-muted-foreground">随机挑选</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {dailyInspirations.slice(0, 3).map((insp) => (
                <div
                  key={insp.id}
                  onClick={() => navigate(`/inspiration/${insp.id}`)}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent hover:shadow-sm cursor-pointer transition-all duration-200 -mx-2"
                >
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{insp.title}</p>
                    {insp.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {insp.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {insp.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] py-0 h-4">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent inspirations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">最近更新</h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/browse')}>
                查看全部 <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recent.map((insp) => (
                <InspirationCard key={insp.id} inspiration={insp} compact />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pinned */}
          {pinned.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">置顶灵感</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {pinned.map((insp) => (
                  <div
                    key={insp.id}
                    onClick={() => navigate(`/inspiration/${insp.id}`)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent hover:shadow-sm cursor-pointer transition-all duration-200 -mx-1"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-sm truncate">{insp.title}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recently viewed */}
          {recentlyViewed.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">最近查看</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {recentlyViewed.map((insp) => (
                  <div
                    key={insp.id}
                    onClick={() => navigate(`/inspiration/${insp.id}`)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent hover:shadow-sm cursor-pointer transition-all duration-200 -mx-1"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{insp.title}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                      {insp.lastViewedAt ? formatDate(insp.lastViewedAt, 'relative') : ''}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">快捷入口</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: '灵感发现', icon: Brain, to: '/discovery' },
                { label: '看板管理', icon: Kanban, to: '/boards' },
                { label: '灵感日记', icon: BookOpen, to: '/diary' },
              ].map((item) => (
                <div
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent hover:shadow-sm cursor-pointer transition-all duration-200 -mx-1"
                >
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm">{item.label}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
