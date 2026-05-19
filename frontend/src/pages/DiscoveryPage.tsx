import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInspirations, useSettings } from '@/hooks/useDb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Clock,
  BellOff,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Settings,
  HelpCircle,
  Zap,
  Swords,
  Users,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { FORGOTTEN_DAYS_THRESHOLD, TIME_CAPSULE_MONTHS } from '@/lib/constants'
import { chatCompletion } from '@/lib/api'
import type { Inspiration } from '@/types'

type DiscoveryMode = 'heuristic' | 'collision' | 'timecapsule' | 'forgotten'
type HeuristicMethod = 'question' | 'stimulus' | 'constraint' | 'collaborate'

const METHODS: { id: HeuristicMethod; label: string; icon: typeof HelpCircle; desc: string }[] = [
  { id: 'question', label: '提问式启发', icon: HelpCircle, desc: '用提问打开思路' },
  { id: 'stimulus', label: '刺激输入法', icon: Zap, desc: '给大脑新燃料' },
  { id: 'constraint', label: '约束与挑战', icon: Swords, desc: '限制催生创意' },
  { id: 'collaborate', label: '协作与互动', icon: Users, desc: '用碰撞激发灵感' },
]

const QUESTION_SUBTYPES = [
  { id: 'open', label: '开放提问', desc: '如果…会怎样？还有什么可能？' },
  { id: 'reverse', label: '反向提问', desc: '最坏情况？反过来呢？' },
  { id: 'scenario', label: '假设情景', desc: '假如你是对方/用户/孩子…' },
]
const STIMULUS_SUBTYPES = [
  { id: 'cross', label: '跨界借鉴', desc: '从其他领域搬思路' },
  { id: 'random', label: '随机刺激', desc: '用一个毫不相关的东西联想' },
  { id: 'case', label: '案例轰炸', desc: '极端成功/失败的案例' },
]
const CONSTRAINT_SUBTYPES = [
  { id: 'limit', label: '加限制', desc: '时间/资源/形式约束' },
  { id: 'extreme', label: '极端化', desc: '做到极致或最低成本' },
  { id: 'roleplay', label: '角色扮演', desc: '换一个身份重新思考' },
]
const COLLAB_SUBTYPES = [
  { id: 'brainstorm', label: '头脑风暴', desc: '先求量不求质' },
  { id: 'plusone', label: '1+1 练习', desc: '我给半成品你接着发展' },
  { id: 'negative', label: '负面脑暴', desc: '列出所有做不好的方法再反转' },
]

const SUBTYPE_MAP: Record<HeuristicMethod, typeof QUESTION_SUBTYPES> = {
  question: QUESTION_SUBTYPES,
  stimulus: STIMULUS_SUBTYPES,
  constraint: CONSTRAINT_SUBTYPES,
  collaborate: COLLAB_SUBTYPES,
}

function buildPrompt(
  insp: Inspiration,
  method: HeuristicMethod,
  subtype: string
): string {
  const tagStr = insp.tags.length > 0 ? `\n标签：${insp.tags.join('、')}` : ''
  const descStr = insp.description ? `\n描述：${insp.description}` : ''
  const ctxStr = insp.source ? `\n来源：${insp.source}` : ''

  const prompts: Record<string, string> = {
    // 提问式
    open: '用开放性提问帮助用户从这条灵感出发发现新方向。只提问，不给答案。问题要避免"是/否"，用"如果…会怎样？""还有什么可能？""反过来呢？""假如资源无限，你会怎么做？"等形式。',
    reverse: '用反向提问帮助用户审视这条灵感。例如："最坏的情况是什么？如何避免？""如果必须在24小时内完成，你会怎么简化？""如果这个想法完全失败了，最可能的原因是什么？"',
    scenario: '用假设情景提问帮助用户换视角。例如："假如你是竞争对手，你会怎么看？""假如你是一个10岁孩子呢？""假如你是5年后的自己呢？""假如你只有100块钱预算呢？"',
    // 刺激输入
    cross: '从完全不同的领域（生物学、艺术、军事策略、科幻、社会学等）找出与这条灵感有关联的想法或机制，然后说明如何借鉴到用户的灵感上。',
    random: '随机提供一个毫不相关的词或概念（比如一种动物、一个日常物品、一种自然现象），让用户强行将它与这条灵感建立关联。解释这个随机刺激物和灵感之间可能的联系。',
    case: '分享3个与这条灵感主题相关的极端案例（成功或失败的都行），重点讲"转折点"和"意外发现"，让用户从中得到启发。案例要简短有力。',
    // 约束与挑战
    limit: '给这条灵感加一个具体的限制条件（时间、资源、形式等），让用户在约束下思考。例如："用5个字解释你的方案""如果必须在1小时内做出原型""只能用免费工具实现"。',
    extreme: '把这条灵感推到极端：做到极致会怎样？做到最低成本会怎样？做到最大规模会怎样？分别描述每种极端情况下的样子和需要做出的改变。',
    roleplay: '让用户扮演一个特定身份（CEO、街头小贩、未来人、外星人、设计师的奶奶等）来重新思考这条灵感，从这个身份的视角给出观察和建议。',
    // 协作与互动
    brainstorm: '针对这条灵感，快速列出8-10个可能的延伸方向或行动方案。先求量不求质量，鼓励大胆和荒谬的想法，不要自我审查。',
    plusone: '基于这条灵感的标题和描述，我先给出一个半成品想法的发展方向，然后你（AI）必须接着往下发展，补充具体的下一步行动。然后我再给出新方向，你再接——模拟三轮"我接你、你接我"的接力。',
    negative: '先列出5-6个"确保这个灵感彻底失败的方法"，越荒谬越好。然后把每个负面方法反转，找出隐藏的正面价值和新方向。',
  }

  return `以下是一条灵感：

标题：${insp.title}${descStr}${tagStr}${ctxStr}

启发方式：${prompts[subtype] || prompts.open}

请用中文回答。以 JSON 格式返回：{"title": "启发标题", "items": [{"heading": "小标题", "content": "具体内容"}]}。只返回 JSON。`
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function DiscoveryPage() {
  const inspirations = useInspirations()
  const appSettings = useSettings()
  const navigate = useNavigate()
  const [activeMode, setActiveMode] = useState<DiscoveryMode>('heuristic')
  const [collision1, setCollision1] = useState<Inspiration | undefined>(undefined)
  const [collision2, setCollision2] = useState<Inspiration | undefined>(undefined)
  const [timeCapsuleMonth, setTimeCapsuleMonth] = useState(6)

  // Heuristic state
  const [method, setMethod] = useState<HeuristicMethod>('question')
  const [subtype, setSubtype] = useState(QUESTION_SUBTYPES[0].id)
  const [seedInspiration, setSeedInspiration] = useState<Inspiration | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ title: string; items: { heading: string; content: string }[] } | null>(null)
  const [error, setError] = useState('')
  const [generateKey, setGenerateKey] = useState(0)

  const apiConfigured = !!(appSettings?.apiBaseUrl && appSettings?.apiKey && appSettings?.apiModel)
  const currentSubtypes = SUBTYPE_MAP[method]

  const generate = useCallback(async () => {
    if (!apiConfigured || inspirations.length === 0) return
    setLoading(true)
    setError('')
    setResult(null)
    const seed = pickRandom(inspirations)
    setSeedInspiration(seed)

    try {
      const text = await chatCompletion({
        baseUrl: appSettings!.apiBaseUrl!,
        apiKey: appSettings!.apiKey!,
        model: appSettings!.apiModel!,
        messages: [
          { role: 'system', content: '你是一个创意启发助手，擅长用各种方法帮助用户从已有灵感中发想新的方向。只返回 JSON，不要额外解释。' },
          { role: 'user', content: buildPrompt(seed, method, subtype) },
        ],
      })
      const parsed = JSON.parse(text.trim())
      setResult(parsed)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (err instanceof SyntaxError) {
        setError('AI 返回格式异常，请重试')
      } else {
        setError(err.message || '请求失败，请检查 API 配置')
      }
    } finally {
      setLoading(false)
    }
  }, [apiConfigured, inspirations, appSettings, method, subtype])

  const switchMethod = useCallback((m: HeuristicMethod) => {
    setMethod(m)
    setSubtype(SUBTYPE_MAP[m][0].id)
    setResult(null)
    setError('')
    setGenerateKey((k) => k + 1)
  }, [])

  const switchSubtype = useCallback((s: string) => {
    setSubtype(s)
    setResult(null)
    setError('')
    setGenerateKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (apiConfigured && inspirations.length > 0) {
      generate()
    }
  }, [generateKey])

  useEffect(() => {
    if (inspirations.length > 0) {
      if (inspirations.length >= 2) {
        const idx1 = Math.floor(Math.random() * inspirations.length)
        let idx2 = Math.floor(Math.random() * inspirations.length)
        while (idx2 === idx1) idx2 = Math.floor(Math.random() * inspirations.length)
        setCollision1(inspirations[idx1])
        setCollision2(inspirations[idx2])
      } else {
        setCollision1(inspirations[0])
        setCollision2(undefined)
      }
    }
  }, [inspirations])

  const collide = useCallback(() => {
    if (inspirations.length < 2) return
    const idx1 = Math.floor(Math.random() * inspirations.length)
    let idx2 = Math.floor(Math.random() * inspirations.length)
    while (idx2 === idx1) idx2 = Math.floor(Math.random() * inspirations.length)
    setCollision1(inspirations[idx1])
    setCollision2(inspirations[idx2])
  }, [inspirations])

  const timeCapsuleInspirations = useMemo(() => {
    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() - timeCapsuleMonth)
    return inspirations.filter((i) => {
      const diff = Math.abs(new Date(i.createdAt).getTime() - targetDate.getTime())
      return diff < 7 * 24 * 60 * 60 * 1000
    })
  }, [inspirations, timeCapsuleMonth])

  const forgottenInspirations = useMemo(() => {
    const now = Date.now()
    return inspirations.filter((i) => {
      const lastView = i.lastViewedAt ? new Date(i.lastViewedAt).getTime() : new Date(i.createdAt).getTime()
      return (now - lastView) > FORGOTTEN_DAYS_THRESHOLD * 24 * 60 * 60 * 1000
    })
  }, [inspirations])

  const modes = [
    { id: 'heuristic' as const, icon: Sparkles, label: '灵感启发', desc: 'AI 驱动的创意发想' },
    { id: 'collision' as const, icon: Lightbulb, label: '跨界碰撞', desc: '组合两个不同灵感' },
    { id: 'timecapsule' as const, icon: Clock, label: '时间胶囊', desc: '回顾过去的灵感' },
    { id: 'forgotten' as const, icon: BellOff, label: '遗忘提醒', desc: '被忽略的灵感' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">灵感发现</h1>
        <p className="text-sm text-muted-foreground mt-1">探索和发现你的灵感宇宙</p>
      </div>

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

      <Card className="min-h-[300px]">
        <CardContent className="p-6">
          {/* ===== Heuristic ===== */}
          {activeMode === 'heuristic' && (
            <div className="space-y-5">
              {!apiConfigured ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium mb-2">请先配置 API 密钥</h3>
                  <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                    灵感启发需要连接大模型 API。支持 OpenAI、DeepSeek、OpenRouter、Ollama 等兼容 OpenAI 格式的服务。
                  </p>
                  <Button size="sm" onClick={() => navigate('/settings')} className="gap-1 text-xs">
                    <Settings className="h-3.5 w-3.5" />
                    前往设置
                  </Button>
                </div>
              ) : (
                <>
                  {/* Method tabs */}
                  <div className="flex flex-wrap gap-1.5">
                    {METHODS.map((m) => (
                      <Button
                        key={m.id}
                        variant={method === m.id ? 'default' : 'ghost'}
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={() => switchMethod(m.id)}
                        disabled={loading}
                      >
                        <m.icon className="h-3.5 w-3.5" />
                        {m.label}
                      </Button>
                    ))}
                  </div>

                  {/* Subtype tabs */}
                  <div className="flex flex-wrap gap-1.5">
                    {currentSubtypes.map((st) => (
                      <Button
                        key={st.id}
                        variant={subtype === st.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="text-[11px] gap-1"
                        onClick={() => switchSubtype(st.id)}
                        disabled={loading}
                      >
                        {st.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentSubtypes.find((s) => s.id === subtype)?.desc}
                  </p>

                  {/* Seed inspiration */}
                  {seedInspiration && (
                    <div
                      onClick={() => navigate(`/inspiration/${seedInspiration.id}`)}
                      className="p-3 rounded-xl bg-accent/50 border cursor-pointer hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] text-muted-foreground">基于灵感</span>
                      </div>
                      <p className="text-sm font-medium">{seedInspiration.title}</p>
                      {seedInspiration.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {seedInspiration.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] py-0 h-4">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loading */}
                  {loading && (
                    <div className="flex flex-col items-center py-8 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">AI 正在思考...</p>
                    </div>
                  )}

                  {/* Error */}
                  {error && !loading && (
                    <div className="flex flex-col items-center py-6 gap-3">
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={generate} className="text-xs gap-1">
                        <RefreshCw className="h-3.5 w-3.5" />重试
                      </Button>
                    </div>
                  )}

                  {/* Result */}
                  {result && !loading && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        {result.title}
                      </p>
                      {result.items.map((item, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl border border-dashed hover:border-primary/40 hover:bg-primary/5 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-primary">{i + 1}</span>
                            </div>
                            <div className="flex-1">
                              {item.heading && (
                                <p className="text-sm font-medium mb-1">{item.heading}</p>
                              )}
                              <p className="text-sm leading-relaxed text-muted-foreground">{item.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="text-xs gap-1">
                          <RefreshCw className="h-3.5 w-3.5" />换一批
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const text = result.items.map((item, i) =>
                              `${i + 1}. ${item.heading ? item.heading + '：' : ''}${item.content}`
                            ).join('\n')
                            navigate(`/capture/new?seedText=${encodeURIComponent(text)}`)
                          }}
                          className="text-xs gap-1"
                        >
                          <Lightbulb className="h-3.5 w-3.5" />记录想法
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== Cross Collision ===== */}
          {activeMode === 'collision' && collision1 && collision2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <Lightbulb className="h-5 w-5 text-primary mx-auto mb-2" />
                    <h3 className="text-sm font-medium mb-1">{collision1.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{collision1.description}</p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {collision1.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50 border-accent">
                  <CardContent className="p-4 text-center">
                    <Lightbulb className="h-5 w-5 text-accent-foreground mx-auto mb-2" />
                    <h3 className="text-sm font-medium mb-1">{collision2.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{collision2.description}</p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {collision2.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">尝试将它们组合，会产生什么新想法？</p>
                <Button variant="outline" size="sm" onClick={collide} className="gap-1">
                  <RefreshCw className="h-3.5 w-3.5" />重新碰撞
                </Button>
              </div>
            </div>
          )}

          {/* ===== Time Capsule ===== */}
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
                  <p className="text-sm text-muted-foreground">{timeCapsuleMonth} 个月前附近没有灵感记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {timeCapsuleInspirations.map((insp) => (
                    <div
                      key={insp.id}
                      onClick={() => navigate(`/inspiration/${insp.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl border hover:bg-accent hover:shadow-sm cursor-pointer transition-all duration-200"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{insp.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(insp.createdAt, 'long')}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== Forgotten ===== */}
          {activeMode === 'forgotten' && (
            <div className="space-y-4">
              {forgottenInspirations.length === 0 ? (
                <div className="text-center py-8">
                  <BellOff className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">所有灵感都在近期有查看，继续保持！</p>
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
                        className="flex items-center gap-3 p-3 rounded-xl border hover:bg-accent hover:shadow-sm cursor-pointer transition-all duration-200"
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
