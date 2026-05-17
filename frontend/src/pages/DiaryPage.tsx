import { useState, useMemo, useEffect } from 'react'
import { useDiaryEntries, useDiaryEntry, saveDiaryEntry, useInspirations } from '@/hooks/useDb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/stores/ui'
import { formatDate, MOOD_LABELS } from '@/lib/utils'
import { BookOpen, ChevronLeft, ChevronRight, Plus, Lightbulb } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns'
import type { Mood } from '@/types'
import { zhCN } from 'date-fns/locale'

export default function DiaryPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<Mood | undefined>(undefined)
  const [showLinkInspiration, setShowLinkInspiration] = useState(false)

  const diaryEntries = useDiaryEntries()
  const currentEntry = useDiaryEntry(selectedDate)
  const allInspirations = useInspirations()
  const addToast = useUIStore((s) => s.addToast)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startBlank = getDay(monthStart)

  const entryDates = useMemo(() => {
    const set = new Set(diaryEntries.map((e) => e.date))
    return set
  }, [diaryEntries])

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDate(dateStr)
    setShowLinkInspiration(false)
  }

  // Load entry content when date changes
  useEffect(() => {
    if (currentEntry) {
      setContent(currentEntry.content)
      setMood(currentEntry.mood)
    } else {
      setContent('')
      setMood(undefined)
    }
  }, [selectedDate, currentEntry])

  const handleSave = async () => {
    if (!content.trim()) return
    await saveDiaryEntry({
      date: selectedDate,
      content: content.trim(),
      mood,
      linkedInspirationIds: currentEntry?.linkedInspirationIds || [],
    })
    addToast('日记已保存', 'success')
  }

  const handleLinkInspiration = async (inspId: string) => {
    const linked = currentEntry?.linkedInspirationIds || []
    const newLinked = linked.includes(inspId)
      ? linked.filter((id) => id !== inspId)
      : [...linked, inspId]
    await saveDiaryEntry({
      date: selectedDate,
      content: currentEntry?.content || '',
      mood,
      linkedInspirationIds: newLinked,
    })
  }

  const linkedInspirations = allInspirations.filter(
    (i) => currentEntry?.linkedInspirationIds?.includes(i.id)
  )

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">灵感日记</h1>
        <p className="text-sm text-muted-foreground mt-1">记录每一天的想法和进展</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(currentMonth, 'yyyy 年 M 月')}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] text-muted-foreground mb-1">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 text-center gap-0.5">
              {Array.from({ length: startBlank }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isSelected = dateStr === selectedDate
                const hasEntry = entryDates.has(dateStr)
                const today = isToday(day)

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : today
                        ? 'bg-primary/10 hover:bg-accent'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasEntry && (
                      <div className={`h-1 w-1 rounded-full mt-0.5 ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">
                {selectedDate === format(new Date(), 'yyyy-MM-dd') ? '今天' : selectedDate}
              </CardTitle>
              <div className="flex items-center gap-1">
                {Object.entries(MOOD_LABELS).map(([key, { label, emoji }]) => (
                  <Button
                    key={key}
                    variant={mood === key ? 'secondary' : 'ghost'}
                    size="icon-sm"
                    onClick={() => setMood(mood === key ? undefined : (key as Mood))}
                    title={label}
                    className="text-sm"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="今天有什么想法和进展？"
                rows={8}
                className="resize-none text-sm"
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowLinkInspiration(!showLinkInspiration)}
                >
                  <Lightbulb className="h-3.5 w-3.5 mr-1" />
                  关联灵感 ({linkedInspirations.length})
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!content.trim()} className="text-xs">
                  保存
                </Button>
              </div>

              {showLinkInspiration && (
                <div className="max-h-48 overflow-auto space-y-1 border rounded-xl p-2">
                  {allInspirations.map((insp) => {
                    const isLinked = currentEntry?.linkedInspirationIds?.includes(insp.id)
                    return (
                      <div
                        key={insp.id}
                        onClick={() => handleLinkInspiration(insp.id)}
                        className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-accent ${
                          isLinked ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className={`h-3 w-3 rounded border flex items-center justify-center ${isLinked ? 'bg-primary border-primary' : ''}`}>
                          {isLinked && <svg className="h-2 w-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                        </div>
                        <span className="truncate">{insp.title}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {linkedInspirations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {linkedInspirations.map((insp) => (
                    <Badge key={insp.id} variant="secondary" className="text-[10px] py-0 h-4">
                      {insp.title.slice(0, 15)}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent entries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">最近日记</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {diaryEntries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="cursor-pointer hover:bg-accent hover:shadow-sm rounded-lg p-2 -mx-2 transition-all duration-200"
                  onClick={() => {
                    setSelectedDate(entry.date)
                    setContent(entry.content)
                    setMood(entry.mood)
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{entry.date}</span>
                    {entry.mood && (
                      <span className="text-sm">{MOOD_LABELS[entry.mood].emoji}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {entry.content}
                  </p>
                </div>
              ))}
              {diaryEntries.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  还没有日记记录
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
