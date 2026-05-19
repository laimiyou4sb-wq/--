import { useState, useEffect } from 'react'
import { useUIStore } from '@/stores/ui'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useSettings, saveSettings } from '@/hooks/useDb'
import { useInspirations, useBoards, useDiaryEntries } from '@/hooks/useDb'
import { chatCompletion } from '@/lib/api'
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Database,
  Trash2,
  FileJson,
  FileText,
  Keyboard,
  Info,
  Key,
  Eye,
  EyeOff,
  Zap,
  Loader2,
} from 'lucide-react'

export default function SettingsPage() {
  const appSettings = useSettings()
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const resolvedTheme = useUIStore((s) => s.resolvedTheme)
  const addToast = useUIStore((s) => s.addToast)
  const inspirations = useInspirations()
  const boards = useBoards()
  const diaryEntries = useDiaryEntries()

  const [backupFileName, setBackupFileName] = useState('')

  // API settings local state
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiModel, setApiModel] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const apiPresets = [
    { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
    { label: 'Ollama', baseUrl: 'http://localhost:11434/v1', model: 'llama3' },
  ]

  useEffect(() => {
    if (appSettings) {
      setTheme(appSettings.theme)
      setApiBaseUrl(appSettings.apiBaseUrl || 'https://api.openai.com/v1')
      setApiKey(appSettings.apiKey || '')
      setApiModel(appSettings.apiModel || 'gpt-4o-mini')
    }
  }, [appSettings])

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    await saveSettings({ theme: newTheme })
  }

  const handleSaveApi = async () => {
    await saveSettings({ apiBaseUrl, apiKey, apiModel })
    addToast('API 配置已保存', 'success')
  }

  const handleTestConnection = async () => {
    if (!apiBaseUrl || !apiKey || !apiModel) {
      addToast('请填写完整的 API 配置', 'error')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      await chatCompletion({
        baseUrl: apiBaseUrl,
        apiKey,
        model: apiModel,
        messages: [{ role: 'user', content: '回复"OK"' }],
      })
      setTestResult('success')
      addToast('连接成功', 'success')
    } catch {
      setTestResult('error')
      addToast('连接失败，请检查配置', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handlePreset = (preset: typeof apiPresets[0]) => {
    setApiBaseUrl(preset.baseUrl)
    setApiModel(preset.model)
  }

  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      inspirations,
      boards,
      diaryEntries,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `灵感备份-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast('JSON 备份已导出', 'success')
  }

  const handleImportJSON = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.inspirations) {
          await db.inspirations.bulkPut(data.inspirations)
        }
        if (data.boards) {
          await db.boards.bulkPut(data.boards)
        }
        if (data.diaryEntries) {
          await db.diaryEntries.bulkPut(data.diaryEntries)
        }
        addToast('数据导入成功', 'success')
      } catch {
        addToast('导入失败，请检查文件格式', 'error')
      }
    }
    input.click()
  }

  const handleExportMarkdown = (id: string) => {
    const insp = inspirations.find((i) => i.id === id)
    if (!insp) return
    let md = `# ${insp.title}\n\n`
    if (insp.description) md += `${insp.description}\n\n`
    if (insp.source) md += `**来源**: ${insp.source}\n\n`
    if (insp.context) md += `**背景**: ${insp.context}\n\n`
    if (insp.tags.length > 0) md += `**标签**: ${insp.tags.join(', ')}\n\n`
    if (insp.links.length > 0) {
      md += `## 相关链接\n\n`
      insp.links.forEach((l) => (md += `- [${l.title || l.url}](${l.url})\n`))
      md += '\n'
    }
    if (insp.actionItems.length > 0) {
      md += `## 行动项\n\n`
      insp.actionItems.forEach((a) => (md += `- [${a.completed ? 'x' : ' '}] ${a.text}\n`))
      md += '\n'
    }
    md += `---\n创建于 ${insp.createdAt} | 更新于 ${insp.updatedAt}\n`

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${insp.title.slice(0, 20)}.md`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Markdown 已导出', 'success')
  }

  const handleClearAll = async () => {
    if (!confirm('确定要清除所有数据吗？此操作不可撤销！')) return
    if (!confirm('再次确认：所有灵感、看板、日记都将被永久删除。')) return

    await db.inspirations.clear()
    await db.boards.clear()
    await db.diaryEntries.clear()
    await db.savedFilters.clear()
    addToast('所有数据已清除', 'success')
  }

  const dataSize = JSON.stringify({ inspirations, boards, diaryEntries }).length

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理应用偏好和数据</p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">外观</CardTitle>
          <CardDescription className="text-xs">选择界面主题</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {[
              { value: 'light' as const, icon: Sun, label: '浅色' },
              { value: 'dark' as const, icon: Moon, label: '深色' },
              { value: 'system' as const, icon: Monitor, label: '跟随系统' },
            ].map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={theme === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange(value)}
                className="gap-1.5 text-xs"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4" />
            API 配置
          </CardTitle>
          <CardDescription className="text-xs">
            配置大模型 API 以使用灵感启发功能。支持 OpenAI、DeepSeek、OpenRouter、Ollama 等兼容 OpenAI Chat Completions 格式的服务。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Presets */}
          <div>
            <h4 className="text-xs font-medium mb-1.5">快捷预设</h4>
            <div className="flex flex-wrap gap-1.5">
              {apiPresets.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-7"
                  onClick={() => handlePreset(p)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div>
            <h4 className="text-xs font-medium mb-1">API 地址</h4>
            <Input
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="h-8 text-xs"
            />
          </div>

          {/* API Key */}
          <div>
            <h4 className="text-xs font-medium mb-1">API 密钥</h4>
            <div className="flex gap-1.5">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="h-8 text-xs"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Model */}
          <div>
            <h4 className="text-xs font-medium mb-1">模型名称</h4>
            <Input
              value={apiModel}
              onChange={(e) => setApiModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="h-8 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveApi} className="text-xs gap-1">
              <Zap className="h-3.5 w-3.5" />
              保存配置
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
              className="text-xs gap-1"
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              测试连接
            </Button>
            {testResult === 'success' && (
              <span className="text-xs text-green-500">连接成功</span>
            )}
            {testResult === 'error' && (
              <span className="text-xs text-red-500">连接失败</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">数据管理</CardTitle>
          <CardDescription className="text-xs">
            {inspirations.length} 条灵感 · {boards.length} 个看板 · {diaryEntries.length} 篇日记
            {' · '}{(dataSize / 1024).toFixed(1)} KB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              导出 JSON 备份
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportJSON} className="gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" />
              导入 JSON 备份
            </Button>
          </div>
          <Separator />
          <div>
            <h4 className="text-xs font-medium mb-2">导出灵感为 Markdown</h4>
            <div className="max-h-32 overflow-auto space-y-1">
              {inspirations.slice(0, 10).map((insp) => (
                <div
                  key={insp.id}
                  onClick={() => handleExportMarkdown(insp.id)}
                  className="flex items-center gap-2 p-1.5 rounded text-xs hover:bg-accent cursor-pointer"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{insp.title}</span>
                </div>
              ))}
              {inspirations.length > 10 && (
                <p className="text-xs text-muted-foreground px-1.5">还有 {inspirations.length - 10} 条...</p>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <Button variant="destructive" size="sm" onClick={handleClearAll} className="gap-1.5 text-xs">
              <Trash2 className="h-3.5 w-3.5" />
              清除所有数据
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            快捷键
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { key: 'Cmd/Ctrl + K', desc: '打开命令面板' },
            { key: 'Cmd/Ctrl + N', desc: '快速捕捉灵感' },
            { key: 'Cmd/Ctrl + /', desc: '显示快捷键帮助' },
            { key: 'Esc', desc: '关闭当前弹窗' },
          ].map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{shortcut.desc}</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-muted font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            关于
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>灵感知识库 v1.0.0</p>
          <p>以实用性为核心的灵感启发工具，帮助你捕捉灵感、连接想法、激发创造力。</p>
          <p>所有数据存储在本地浏览器中，完全离线可用。</p>
        </CardContent>
      </Card>
    </div>
  )
}
