import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInspirations } from '@/hooks/useDb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Shuffle,
  Sparkles,
  Clock,
  BellOff,
  Lightbulb,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { FORGOTTEN_DAYS_THRESHOLD, TIME_CAPSULE_MONTHS } from '@/lib/constants'

type DiscoveryMode = 'random' | 'collision' | 'timecapsule' | 'forgotten'

export default function DiscoveryPage() {
  const inspirations = useInspirations()
  const navigate = useNavigate()
  const [activeMode, setActiveMode] = useState<DiscoveryMode>('random')
  const [randomInspiration, setRandomInspiration] = useState(inspirations[0])
  const [collision1, setCollision1] = useState(inspirations[0])
  const [collision2, setCollision2] = useState(inspirations[1])
  const [timeCapsuleMonth, setTimeCapsuleMonth] = useState(6)

  // Random walk
  const shuffle = useCallback(() => {
    if (inspirations.length === 0) return
    const idx = Math.floor(Math.random() * inspirations.length)
    setRandomInspiration(inspirations[idx])
  }, [inspirations])

  const collide = useCallback(() => {
    if (inspirations.length < 2) return
    const idx1 = Math.floor(Math.random() * inspirations.length)
    let idx2 = Math.floor(Math.random() * inspirations.length)
    while (idx2 === idx1) idx2 = Math.floor(Math.random() * inspirations.length)
    setCollision1(inspirations[idx1])
    setCollision2(inspirations[idx2])
  }, [inspirations])

  // Time capsule
  const timeCapsuleInspirations = useMemo(() => {
    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() - timeCapsuleMonth)
    const targetStr = targetDate.toISOString().split('T')[0]
    return inspirations.filter((i) => {
      const d = i.createdAt.split('T')[0]
      // Within 7 days of the target date
      const diff = Math.abs(new Date(d).getTime() - targetDate.getTime())
      return diff < 7 * 24 * 60 * 60 * 1000
    })
  }, [inspirations, timeCapsuleMonth])

  // Forgotten
  const forgottenInspirations = useMemo(() => {
    const now = Date.now()
    return inspirations.filter((i) => {
      const lastView = i.lastViewedAt ? new Date(i.lastViewedAt).getTime() : new Date(i.createdAt).getTime()
      return (now - lastView) > FORGOTTEN_DAYS_THRESHOLD * 24 * 60 * 60 * 1000
    })
  }, [inspirations])

  const modes = [
    { id: 'random' as const, icon: Shuffle, label: '随机漫步', desc: '随机展示一条灵感' },
    { id: 'collision' as const, icon: Sparkles, label: '跨界碰撞', desc: '组合两个不同灵感' },
    { id: 'timecapsule' as const, icon: Clock, label: '时间胶囊', desc: '回顾过去的灵感' },
    { id: 'forgotten' as const, icon: BellOff, label: '遗忘提醒', desc: '被忽略的灵感' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">灵感发现</h1>
        <p className="text-sm text-muted-foreground mt-1">
          探索和发现你的灵感宇宙
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {modes.map((mode) => (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeMode === mode.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setActiveMode(mode.id)}
          >
            <CardContent className="p-4 text-center">
              <mode.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
              <h3 className="text-sm font-medium">{mode.label}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{mode.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content area */}
      <Card className="min-h-[300px]">
        <CardContent className="p-6">
          {/* Random Walk */}
          {activeMode === 'random' && randomInspiration && (
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Shuffle className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{randomInspiration.title}</h2>
              {randomInspiration.description && (
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {randomInspiration.description}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {randomInspiration.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] py-0 h-4">
                    {tag}
                  </Badge>
                ))}
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(randomInspiration.createdAt, 'relative')}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={shuffle} className="gap-1">
                  <RefreshCw className="h-3.5 w-3.5" />
                  换一个
                </Button>
                <Button size="sm" onClick={() => navigate(`/inspiration/${randomInspiration.id}`)} className="gap-1">
                  查看详情 <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Cross Collision */}
          {activeMode === 'collision' && collision1 && collision2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <Lightbulb className="h-5 w-5 text-primary mx-auto mb-2" />
                    <h3 className="text-sm font-medium mb-1">{collision1.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {collision1.description}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {collision1.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50 border-accent">
                  <CardContent className="p-4 text-center">
                    <Lightbulb className="h-5 w-5 text-accent-foreground mx-auto mb-2" />
                    <h3 className="text-sm font-medium mb-1">{collision2.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {collision2.description}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {collision2.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  尝试将它们组合，会产生什么新想法？
                </p>
                <Button variant="outline" size="sm" onClick={collide} className="gap-1">
                  <RefreshCw className="h-3.5 w-3.5" />
                  重新碰撞
                </Button>
              </div>
            </div>
          )}

          {/* Time Capsule */}
          {activeMode === 'timecapsule' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                {TIME_CAPSULE_MONTHS.map((m) => (
                  <Button
                    key={m}
                    variant={timeCapsuleMonth === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeCapsuleMonth(m)}
                    className="text-xs"
                  >
                    {m === 1 ? '1 个月前' : m === 6 ? '半年前' : '1 年前'}
                  </Button>
                ))}
              </div>
              {timeCapsuleInspirations.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {timeCapsuleMonth} 个月前附近没有灵感记录
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {timeCapsuleInspirations.map((insp) => (
                    <div
                      key={insp.id}
                      onClick={() => navigate(`/inspiration/${insp.id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{insp.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(insp.createdAt, 'long')}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Forgotten */}
          {activeMode === 'forgotten' && (
            <div className="space-y-4">
              {forgottenInspirations.length === 0 ? (
                <div className="text-center py-8">
                  <BellOff className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    所有灵感都在近期有查看，继续保持！
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    以下 {forgottenInspirations.length} 条灵感已经超过 {FORGOTTEN_DAYS_THRESHOLD} 天没有被查看了
                  </p>
                  <div className="space-y-2">
                    {forgottenInspirations.map((insp) => (
                      <div
                        key={insp.id}
                        onClick={() => navigate(`/inspiration/${insp.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      >
                        <BellOff className="h-4 w-4 text-orange-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{insp.title}</p>
                          <p className="text-xs text-muted-foreground">
                            最后查看: {insp.lastViewedAt ? formatDate(insp.lastViewedAt, 'long') : '从未查看'}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
