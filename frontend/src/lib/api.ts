export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  baseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  signal?: AbortSignal
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  const { baseUrl, apiKey, model, messages, signal } = options

  const url = baseUrl.replace(/\/+$/, '') + '/chat/completions'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 1200,
    }),
    signal,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      throw new ApiError('API 密钥无效或没有权限', res.status, body)
    }
    if (res.status === 429) {
      throw new ApiError('请求过于频繁，请稍后再试', res.status, body)
    }
    throw new ApiError(
      `API 请求失败 (${res.status})${body ? ': ' + body.slice(0, 200) : ''}`,
      res.status,
      body
    )
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}
